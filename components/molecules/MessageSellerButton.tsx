"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface MessageSellerButtonProps {
  adId: string;
  isAuthenticated: boolean;
  isOwnAd: boolean;
}

export function MessageSellerButton({
  adId,
  isAuthenticated,
  isOwnAd,
}: MessageSellerButtonProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isOwnAd) return null;

  async function startConversation() {
    if (!isAuthenticated) {
      router.push(`/login?next=/ad/${adId}`);
      return;
    }
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adId }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Failed to start conversation.");
        return;
      }
      router.push(`/messages/${data.id}`);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex-1">
      <button
        type="button"
        onClick={startConversation}
        disabled={pending}
        className="bg-secondary text-secondary-foreground flex h-[52px] w-full items-center justify-center gap-2 rounded-xl text-sm font-bold transition-transform active:scale-95 disabled:opacity-50"
      >
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
          <path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        {pending ? "Starting..." : "Message"}
      </button>
      {error ? <p className="text-destructive mt-1 text-xs">{error}</p> : null}
    </div>
  );
}
