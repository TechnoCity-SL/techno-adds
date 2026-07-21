"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const response = await fetch(`/api/auth/${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    setPending(false);

    if (!response.ok) {
      setError(
        typeof data.error === "string" ? data.error : "Something went wrong.",
      );
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="bg-primary absolute -top-[10%] -left-[10%] h-[40%] w-[40%] rounded-full opacity-5 blur-[120px]" />
        <div className="bg-secondary absolute -right-[10%] -bottom-[10%] h-[50%] w-[50%] rounded-full opacity-5 blur-[120px]" />
      </div>

      <main className="relative z-10 w-full max-w-md">
        <header className="mb-6 text-center">
          <h1 className="text-primary text-3xl font-bold">TechnoAds</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            {mode === "login"
              ? "Welcome back. Let's get you signed in."
              : "Create an account to start buying and selling."}
          </p>
        </header>

        <div className="mb-6 flex flex-col gap-3">
          {/* Plain <a>, not <Link>: this must be a real full-page navigation so the
              browser follows the route handler's redirect to the OAuth provider,
              not client-side App Router navigation. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a
            href="/api/auth/oauth/google"
            className="bg-card border-border hover:bg-muted flex h-12 items-center justify-center gap-3 rounded-xl border text-sm font-semibold transition-colors active:scale-[0.98]"
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.4c-.3 1.5-1.1 2.7-2.4 3.6v3h3.9c2.3-2.1 3.6-5.2 3.6-8.8Z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.2 0 6-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.1-4 1.1-3.1 0-5.7-2.1-6.6-4.9H1.4v3.1C3.3 21.3 7.3 24 12 24Z"
              />
              <path
                fill="#FBBC05"
                d="M5.4 14.3c-.2-.7-.4-1.5-.4-2.3s.1-1.6.4-2.3V6.6H1.4A12 12 0 0 0 0 12c0 1.9.5 3.8 1.4 5.4l4-3.1Z"
              />
              <path
                fill="#EA4335"
                d="M12 4.8c1.7 0 3.3.6 4.5 1.8l3.4-3.4C17.9 1.2 15.2 0 12 0 7.3 0 3.3 2.7 1.4 6.6l4 3.1C6.3 6.9 8.9 4.8 12 4.8Z"
              />
            </svg>
            Continue with Google
          </a>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a
            href="/api/auth/oauth/facebook"
            className="flex h-12 items-center justify-center gap-3 rounded-xl bg-[#1877F2] text-sm font-semibold text-white transition-opacity active:scale-[0.98]"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            Continue with Facebook
          </a>
        </div>

        <div className="text-muted-foreground mb-6 flex items-center gap-4 text-xs">
          <div className="bg-border h-px flex-1" />
          <span className="font-semibold tracking-widest uppercase">or</span>
          <div className="bg-border h-px flex-1" />
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="ml-1 text-xs font-semibold">
              Email Address
            </label>
            <div className="relative">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-muted-foreground pointer-events-none absolute top-1/2 left-4 -translate-y-1/2"
              >
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m22 6-10 7L2 6" />
              </svg>
              <input
                id="email"
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="bg-muted border-border focus:border-primary focus:ring-primary/30 h-12 w-full rounded-xl border pr-4 pl-12 text-sm focus:ring-1 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="password" className="ml-1 text-xs font-semibold">
              Password
            </label>
            <div className="relative">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-muted-foreground pointer-events-none absolute top-1/2 left-4 -translate-y-1/2"
              >
                <rect x="3" y="11" width="18" height="10" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="bg-muted border-border focus:border-primary focus:ring-primary/30 h-12 w-full rounded-xl border pr-12 pl-12 text-sm focus:ring-1 focus:outline-none"
              />
              <button
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((prev) => !prev)}
                className="text-muted-foreground hover:text-foreground absolute top-1/2 right-4 -translate-y-1/2 transition-colors"
              >
                {showPassword ? (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 10 8 10 8a13.16 13.16 0 0 1-1.67 2.68M6.61 6.61C4 8.24 2 12 2 12s3 8 10 8a9.16 9.16 0 0 0 5.06-1.5" />
                    <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                    <path d="m1 1 22 22" />
                  </svg>
                ) : (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error ? <p className="text-destructive text-sm">{error}</p> : null}

          <button
            type="submit"
            disabled={pending}
            className="bg-primary text-primary-foreground shadow-primary/20 mt-2 h-14 rounded-xl text-base font-bold shadow-lg transition-transform active:scale-95 disabled:opacity-50"
          >
            {pending
              ? "Please wait..."
              : mode === "login"
                ? "Log In"
                : "Sign Up"}
          </button>
        </form>

        <footer className="mt-6 text-center">
          <p className="text-muted-foreground text-sm">
            {mode === "login" ? (
              <>
                Don&apos;t have an account?{" "}
                <Link href="/signup" className="text-primary font-bold">
                  Sign Up
                </Link>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <Link href="/login" className="text-primary font-bold">
                  Log In
                </Link>
              </>
            )}
          </p>
        </footer>
      </main>

      <div className="fixed top-1/2 right-[8%] hidden w-80 -translate-y-1/2 lg:block">
        <div className="bg-card/80 border-border space-y-4 rounded-2xl border p-6 shadow-xl backdrop-blur-md">
          <div className="bg-secondary text-primary flex h-12 w-12 items-center justify-center rounded-full">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2 4 5v6c0 5 3.5 8.5 8 11 4.5-2.5 8-6 8-11V5l-8-3Z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          </div>
          <h3 className="text-lg font-bold">Secure Access</h3>
          <p className="text-muted-foreground text-sm">
            Phone-verified sellers, moderated listings, and a marketplace built
            for trust across Sri Lanka.
          </p>
        </div>
      </div>
    </div>
  );
}
