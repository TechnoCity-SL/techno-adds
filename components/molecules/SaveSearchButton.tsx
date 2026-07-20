"use client";

import { useState } from "react";

interface SaveSearchButtonProps {
  query: string;
  isAuthenticated: boolean;
}

export function SaveSearchButton({
  query,
  isAuthenticated,
}: SaveSearchButtonProps) {
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (!isAuthenticated) {
      window.location.href = `/login?next=/search?q=${encodeURIComponent(query)}`;
      return;
    }
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/saved-searches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ q: query }),
      });
      if (response.ok) {
        setSaved(true);
      } else {
        const data = await response.json();
        setError(data.error ?? "Failed to save search.");
      }
    } finally {
      setPending(false);
    }
  }

  if (saved) {
    return <p className="text-muted-foreground text-sm">✓ Search saved</p>;
  }

  return (
    <div>
      <button
        type="button"
        onClick={save}
        disabled={pending}
        className="border-border rounded-md border px-3 py-1.5 text-sm font-medium disabled:opacity-50"
      >
        {pending ? "Saving..." : "☆ Save this search"}
      </button>
      {error ? <p className="mt-1 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
