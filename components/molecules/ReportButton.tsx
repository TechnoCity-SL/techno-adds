"use client";

import { useState } from "react";

interface ReportButtonProps {
  targetType: "ad" | "user";
  targetId: string;
  isAuthenticated: boolean;
}

export function ReportButton({
  targetType,
  targetId,
  isAuthenticated,
}: ReportButtonProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <p className="text-muted-foreground text-xs font-medium">
        Report submitted.
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          if (!isAuthenticated) {
            window.location.href = `/login?next=/ad/${targetId}`;
            return;
          }
          setOpen(true);
        }}
        className="text-muted-foreground hover:text-primary flex items-center gap-1 text-xs font-medium transition-colors"
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
          <path d="M12 9v4M12 17h.01" />
          <path d="M10.29 3.86 1.82 18a1 1 0 0 0 .86 1.5h18.64a1 1 0 0 0 .86-1.5L13.71 3.86a1 1 0 0 0-1.72 0Z" />
        </svg>
        Report Ad
      </button>
    );
  }

  async function submit() {
    if (reason.trim().length < 5) {
      setError("Please describe the issue in a bit more detail.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetType, targetId, reason: reason.trim() }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(
          typeof data.error === "string" ? data.error : "Failed to report.",
        );
        return;
      }
      setSubmitted(true);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="border-border bg-card w-full rounded-xl border p-3">
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Why are you reporting this?"
        maxLength={500}
        rows={3}
        className="border-border w-full rounded-lg border px-3 py-2 text-sm"
      />
      {error ? <p className="mt-1 text-sm text-red-600">{error}</p> : null}
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={submit}
          disabled={pending}
          className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          {pending ? "Submitting..." : "Submit report"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          disabled={pending}
          className="border-border rounded-lg border px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
