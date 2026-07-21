"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface PhoneNumberItem {
  id: string;
  phoneE164: string;
  isVerified: boolean;
  isHidden: boolean;
}

interface AccountSettingsFormProps {
  initialDisplayName: string;
  memberSince: number | null;
  isVerified: boolean;
  phoneNumbers: PhoneNumberItem[];
}

export function AccountSettingsForm({
  initialDisplayName,
  memberSince,
  isVerified,
  phoneNumbers,
}: AccountSettingsFormProps) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [phones, setPhones] = useState(phoneNumbers);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const dirty = displayName.trim() !== initialDisplayName;

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const response = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: displayName.trim() }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(
          typeof data.error === "string"
            ? data.error
            : "Failed to save settings.",
        );
        return;
      }
      setSaved(true);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function toggleHidden(id: string, isHidden: boolean) {
    setPhones((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isHidden } : p)),
    );
    await fetch(`/api/account/phone-numbers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isHidden }),
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="bg-card border-border flex items-center gap-4 rounded-xl border p-4 shadow-sm">
        <div className="border-accent bg-primary text-primary-foreground flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-4 text-2xl font-bold">
          {(initialDisplayName[0] ?? "?").toUpperCase()}
        </div>
        <div>
          <h2 className="text-lg font-bold">{initialDisplayName}</h2>
          {isVerified ? (
            <div className="bg-accent text-primary mt-1 flex w-fit items-center gap-1 rounded-full px-2 py-0.5">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 2 4 5v6c0 5 3.5 8.5 8 11 4.5-2.5 8-6 8-11V5l-8-3Z" />
              </svg>
              <span className="text-xs font-semibold">Verified Member</span>
            </div>
          ) : null}
          {memberSince ? (
            <p className="text-muted-foreground mt-1 text-xs">
              Since {memberSince}
            </p>
          ) : null}
        </div>
      </section>

      <section>
        <label htmlFor="displayName" className="ml-1 text-xs font-semibold">
          Display Name
        </label>
        <input
          id="displayName"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="bg-card border-border focus:border-primary focus:ring-primary/30 mt-2 h-12 w-full rounded-xl border px-4 text-sm focus:ring-1 focus:outline-none"
        />
        <p className="text-muted-foreground mt-2 ml-1 text-xs">
          This is how your name will appear on your public listings.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-muted-foreground text-xs font-semibold">
            Phone Numbers &amp; Verification
          </h3>
          <Link
            href="/account/verify-phone"
            className="text-primary flex items-center gap-1 text-xs font-semibold hover:underline"
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
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v8M8 12h8" />
            </svg>
            Add phone number
          </Link>
        </div>

        {phones.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No phone numbers added yet.
          </p>
        ) : (
          phones.map((phone) => (
            <div
              key={phone.id}
              className="bg-card border-border flex items-center justify-between rounded-xl border p-4 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="bg-accent text-primary flex h-12 w-12 items-center justify-center rounded-full">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="7" y="2" width="10" height="20" rx="2" />
                    <path d="M11 18h2" />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">
                      {phone.phoneE164}
                    </span>
                    <span className="bg-accent text-primary flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold">
                      Verified
                    </span>
                  </div>
                  <p className="text-muted-foreground text-xs">
                    Verified phone number
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-muted-foreground text-[10px]">
                  Hide Publicly
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={phone.isHidden}
                  onClick={() => toggleHidden(phone.id, !phone.isHidden)}
                  className="relative inline-flex items-center"
                >
                  <span
                    className={`block h-6 w-11 rounded-full transition-colors ${phone.isHidden ? "bg-primary" : "bg-border"}`}
                  />
                  <span
                    className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${phone.isHidden ? "translate-x-5" : ""}`}
                  />
                </button>
              </div>
            </div>
          ))
        )}
      </section>

      <div className="bg-accent/40 border-accent flex items-start gap-3 rounded-xl border p-4">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-primary mt-0.5 shrink-0"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
        </svg>
        <div>
          <h5 className="text-primary text-xs font-bold">
            Why verify your number?
          </h5>
          <p className="text-muted-foreground mt-1 text-xs">
            Verified users get more responses on ads and are prioritized in
            search results. It helps build a safer community for everyone.
          </p>
        </div>
      </div>

      {error ? <p className="text-destructive text-sm">{error}</p> : null}
      {saved ? (
        <p className="text-primary text-sm font-semibold">Settings saved.</p>
      ) : null}

      <div className="flex gap-4">
        <button
          type="button"
          disabled={!dirty || saving}
          onClick={() => setDisplayName(initialDisplayName)}
          className="border-border h-14 flex-1 rounded-xl border text-sm font-semibold disabled:opacity-50"
        >
          Discard changes
        </button>
        <button
          type="button"
          disabled={!dirty || saving}
          onClick={handleSave}
          className="bg-primary text-primary-foreground h-14 flex-1 rounded-xl text-sm font-bold shadow-md transition-transform active:scale-95 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save settings"}
        </button>
      </div>
    </div>
  );
}
