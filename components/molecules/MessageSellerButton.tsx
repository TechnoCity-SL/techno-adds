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
    <div>
      <button
        type="button"
        onClick={startConversation}
        disabled={pending}
        className="border-border rounded-md border px-4 py-2.5 text-sm font-medium disabled:opacity-50"
      >
        {pending ? "Starting..." : "💬 Message Seller"}
      </button>
      {error ? <p className="mt-1 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
