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
    return <p className="text-muted-foreground text-sm">Report submitted.</p>;
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
        className="border-border rounded-md border px-4 py-2.5 text-sm font-medium"
      >
        🚩 Report
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
    <div className="border-border w-full rounded-md border p-3">
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Why are you reporting this?"
        maxLength={500}
        rows={3}
        className="border-border w-full rounded-md border px-3 py-2 text-sm"
      />
      {error ? <p className="mt-1 text-sm text-red-600">{error}</p> : null}
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={submit}
          disabled={pending}
          className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          {pending ? "Submitting..." : "Submit report"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          disabled={pending}
          className="border-border rounded-md border px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
