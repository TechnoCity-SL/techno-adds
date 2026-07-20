"use client";

import { useState } from "react";
import Link from "next/link";

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
      <p className="text-muted-foreground text-sm">
        No saved searches yet. Save one from the search results page.
      </p>
    );
  }

  return (
    <ul className="divide-border divide-y">
      {searches.map((s) => (
        <li key={s.id} className="flex items-center justify-between py-3">
          <Link
            href={`/search?q=${encodeURIComponent(s.query)}`}
            className="text-sm font-medium"
          >
            {s.query}
          </Link>
          <button
            type="button"
            onClick={() => remove(s.id)}
            disabled={pendingId === s.id}
            className="border-border rounded-md border px-3 py-1.5 text-sm disabled:opacity-50"
          >
            Remove
          </button>
        </li>
      ))}
    </ul>
  );
}
