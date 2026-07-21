"use client";

import { useState } from "react";
import Link from "next/link";
import { relativeTime } from "@/lib/utils";

interface SavedSearchItem {
  id: string;
  query: string;
  createdAt: string;
}

export function SavedSearchList({
  initialSearches,
}: {
  initialSearches: SavedSearchItem[];
}) {
  const [searches, setSearches] = useState(initialSearches);
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function remove(id: string) {
    setPendingId(id);
    try {
      const response = await fetch(`/api/saved-searches/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setSearches((prev) => prev.filter((s) => s.id !== id));
      }
    } finally {
      setPendingId(null);
    }
  }

  if (searches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="bg-muted mb-6 flex h-32 w-32 items-center justify-center rounded-full">
          <svg
            width="56"
            height="56"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-primary"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </div>
        <h2 className="text-lg font-bold">No saved searches yet</h2>
        <p className="text-muted-foreground mt-2 mb-6 max-w-sm text-sm">
          Save your frequent searches to get notified when new items matching
          your criteria are posted.
        </p>
        <Link
          href="/"
          className="bg-primary text-primary-foreground rounded-full px-8 py-3 text-sm font-semibold shadow-lg transition-transform active:scale-95"
        >
          Explore Categories
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {searches.map((s) => (
        <div
          key={s.id}
          className="bg-card border-border hover:border-primary/30 flex items-center justify-between rounded-xl border p-4 shadow-sm transition-colors"
        >
          <Link
            href={`/search?q=${encodeURIComponent(s.query)}`}
            className="flex min-w-0 items-center gap-3"
          >
            <div className="bg-accent text-primary flex h-12 w-12 shrink-0 items-center justify-center rounded-lg">
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
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{s.query}</p>
              <p className="text-muted-foreground text-xs">
                Saved {relativeTime(s.createdAt)}
              </p>
            </div>
          </Link>
          <button
            type="button"
            aria-label="Remove saved search"
            onClick={() => remove(s.id)}
            disabled={pendingId === s.id}
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors disabled:opacity-50"
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
              <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14Z" />
              <path d="M10 11v6M14 11v6" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
