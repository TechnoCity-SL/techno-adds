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
    <section className="bg-card border-border overflow-hidden rounded-2xl border shadow-sm">
      <div className="border-border bg-muted/30 flex items-center justify-between border-b px-5 py-4">
        <h2 className="text-base font-bold">Pending Ads Queue</h2>
        {ads.length > 0 ? (
          <span className="bg-primary text-primary-foreground rounded-full px-3 py-1 text-[10px] font-bold">
            {ads.length} pending
          </span>
        ) : null}
      </div>

      {error ? (
        <p className="text-destructive px-5 pt-4 text-sm">{error}</p>
      ) : null}

      {ads.length === 0 ? (
        <p className="text-muted-foreground p-5 text-sm">
          No ads pending review.
        </p>
      ) : (
        <ul className="divide-border divide-y">
          {ads.map((ad) => (
            <li
              key={ad.id}
              className="hover:bg-muted/50 flex flex-col gap-3 px-5 py-4 transition-colors sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-sm font-bold">{ad.title}</p>
                <p className="text-primary text-sm font-semibold">
                  Rs. {ad.price.toLocaleString()}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={pendingId === ad.id}
                  onClick={() => moderate(ad.id, "reject")}
                  className="text-destructive hover:bg-destructive/10 flex h-9 w-9 items-center justify-center rounded-lg transition-colors disabled:opacity-50"
                  title="Reject"
                >
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
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
                <button
                  type="button"
                  disabled={pendingId === ad.id}
                  onClick={() => moderate(ad.id, "approve")}
                  className="bg-accent text-primary hover:bg-primary hover:text-primary-foreground flex h-9 w-9 items-center justify-center rounded-lg transition-colors disabled:opacity-50"
                  title="Approve"
                >
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
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
