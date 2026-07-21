"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const RESEND_SECONDS = 60;

export function VerifyPhoneForm() {
  const router = useRouter();
  const [phase, setPhase] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (phase !== "otp" || secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [phase, secondsLeft]);

  async function sendCode() {
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(
          typeof data.error === "string"
            ? data.error
            : "Failed to send verification code.",
        );
        return;
      }
      setDigits(Array(6).fill(""));
      setSecondsLeft(RESEND_SECONDS);
      setPhase("otp");
    } finally {
      setPending(false);
    }
  }

  function handleDigitChange(index: number, value: string) {
    const clean = value.replace(/\D/g, "").slice(-1);
    setDigits((prev) => {
      const next = [...prev];
      next[index] = clean;
      return next;
    });
    if (clean && index < digits.length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleDigitKeyDown(
    index: number,
    event: React.KeyboardEvent<HTMLInputElement>,
  ) {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  async function verifyCode() {
    const code = digits.join("");
    if (code.length !== 6) {
      setError("Enter the full 6-digit code.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/account/phone-numbers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code }),
      });
      const data = await response.json();
      if (!response.ok || !data.verified) {
        setError("Incorrect or expired code. Try again.");
        return;
      }
      router.push("/account");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  if (phase === "phone") {
    return (
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-4">
        <div className="mt-8 mb-10 flex justify-center">
          <div className="bg-muted flex h-48 w-48 items-center justify-center rounded-full">
            <div className="bg-card border-border -rotate-6 rounded-2xl border p-6 shadow-sm">
              <svg
                width="64"
                height="64"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-primary"
              >
                <rect x="7" y="2" width="10" height="20" rx="2" />
                <path d="M11 18h2" />
              </svg>
            </div>
          </div>
        </div>

        <h1 className="text-xl font-bold">Add a phone number</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          We&apos;ll send a 6-digit verification code via SMS.
        </p>

        <div className="mt-6 flex flex-col gap-2">
          <label htmlFor="phone" className="ml-1 text-xs font-semibold">
            Phone Number
          </label>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="07XXXXXXXX"
            className="bg-card border-border focus:border-primary focus:ring-primary/30 h-14 w-full rounded-xl border px-4 text-base focus:ring-1 focus:outline-none"
          />
        </div>

        {error ? (
          <p className="text-destructive mt-3 text-sm">{error}</p>
        ) : null}

        <div className="mt-auto pb-8">
          <button
            type="button"
            disabled={pending || phone.trim().length === 0}
            onClick={sendCode}
            className="bg-primary text-primary-foreground flex h-14 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold shadow-sm transition-transform active:scale-95 disabled:opacity-50"
          >
            {pending ? "Sending..." : "Send code"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-4">
      <div className="mt-8 mb-10 flex justify-center">
        <div className="bg-muted flex h-48 w-48 items-center justify-center rounded-full">
          <div className="bg-card border-border -rotate-6 rounded-2xl border p-6 shadow-sm">
            <svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-primary"
            >
              <path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
        </div>
      </div>

      <h1 className="text-xl font-bold">Verify your number</h1>
      <p className="text-muted-foreground mt-2 text-sm">
        We&apos;ve sent a 6-digit verification code to{" "}
        <span className="text-foreground font-bold">{phone}</span>. Enter it
        below to proceed.
      </p>

      <div className="mt-6 mb-6 grid grid-cols-6 gap-2">
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleDigitChange(index, e.target.value)}
            onKeyDown={(e) => handleDigitKeyDown(index, e)}
            className="bg-card border-border text-primary focus:border-primary focus:ring-primary/30 h-14 w-full rounded-xl border text-center text-xl font-bold focus:ring-1 focus:outline-none"
          />
        ))}
      </div>

      <div className="mb-6 flex flex-col items-center gap-2">
        <p className="text-muted-foreground text-sm">
          Didn&apos;t receive the code?
        </p>
        <button
          type="button"
          disabled={secondsLeft > 0 || pending}
          onClick={sendCode}
          className="text-primary disabled:text-muted-foreground flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 12a9 9 0 1 1-2.64-6.36L21 8" />
            <path d="M21 3v5h-5" />
          </svg>
          Resend code
          {secondsLeft > 0 ? (
            <span className="font-bold">
              (0:{secondsLeft.toString().padStart(2, "0")})
            </span>
          ) : null}
        </button>
      </div>

      {error ? (
        <p className="text-destructive mb-3 text-center text-sm">{error}</p>
      ) : null}

      <div className="mt-auto pb-8">
        <button
          type="button"
          disabled={pending}
          onClick={verifyCode}
          className="bg-primary text-primary-foreground flex h-14 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold shadow-sm transition-transform active:scale-95 disabled:opacity-50"
        >
          {pending ? "Verifying..." : "Verify"}
        </button>
        <p className="text-muted-foreground mt-4 px-6 text-center text-xs">
          By verifying, you agree to our Terms of Service and Privacy Policy for
          TechnoAds security.
        </p>
      </div>
    </div>
  );
}
