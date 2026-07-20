"use client";

import { useState } from "react";

interface FavoriteButtonProps {
  adId: string;
  initialFavorited: boolean;
  isAuthenticated: boolean;
}

export function FavoriteButton({
  adId,
  initialFavorited,
  isAuthenticated,
}: FavoriteButtonProps) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [pending, setPending] = useState(false);

  async function toggle() {
    if (!isAuthenticated) {
      window.location.href = `/login?next=/ad/${adId}`;
      return;
    }
    setPending(true);
    try {
      const response = await fetch(`/api/ads/${adId}/favorite`, {
        method: favorited ? "DELETE" : "POST",
      });
      if (response.ok) setFavorited(!favorited);
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      className={`rounded-md border px-4 py-2.5 text-sm font-medium disabled:opacity-50 ${
        favorited
          ? "bg-primary text-primary-foreground border-primary"
          : "border-border"
      }`}
    >
      {favorited ? "★ Favorited" : "☆ Favorite"}
    </button>
  );
}
