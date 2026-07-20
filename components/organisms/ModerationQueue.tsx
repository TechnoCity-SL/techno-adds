"use client";

import { useState } from "react";

interface PendingAd {
  id: string;
  title: string;
  price: number;
}

export function ModerationQueue({ initialAds }: { initialAds: PendingAd[] }) {
  const [ads, setAds] = useState(initialAds);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function moderate(adId: string, action: "approve" | "reject") {
    setPendingId(adId);
    setError(null);
    try {
      const response = await fetch(`/api/admin/ads/${adId}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(
          typeof data.error === "string" ? data.error : `Failed to ${action}`,
        );
        return;
      }
      setAds((prev) => prev.filter((ad) => ad.id !== adId));
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="mb-4 text-xl font-semibold">Moderation Queue</h1>
      {error ? <p className="text-destructive mb-4 text-sm">{error}</p> : null}

      {ads.length === 0 ? (
        <p className="text-muted-foreground text-sm">No ads pending review.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {ads.map((ad) => (
            <li
              key={ad.id}
              className="border-border flex flex-col gap-2 rounded-md border p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium">{ad.title}</p>
                <p className="text-muted-foreground text-sm">
                  Rs. {ad.price.toLocaleString()}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={pendingId === ad.id}
                  onClick={() => moderate(ad.id, "approve")}
                  className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50"
                >
                  Approve
                </button>
                <button
                  type="button"
                  disabled={pendingId === ad.id}
                  onClick={() => moderate(ad.id, "reject")}
                  className="border-destructive text-destructive rounded-md border px-4 py-2 text-sm font-medium disabled:opacity-50"
                >
                  Reject
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
