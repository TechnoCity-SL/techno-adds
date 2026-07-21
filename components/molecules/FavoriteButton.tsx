"use client";

import { useState } from "react";

interface FavoriteButtonProps {
  adId: string;
  initialFavorited: boolean;
  isAuthenticated: boolean;
  variant?: "icon" | "pill";
  /** Smaller footprint for the icon variant, for overlaying on ad-card thumbnails. */
  compact?: boolean;
}

export function FavoriteButton({
  adId,
  initialFavorited,
  isAuthenticated,
  variant = "pill",
  compact = false,
}: FavoriteButtonProps) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [pending, setPending] = useState(false);

  async function toggle(event?: React.MouseEvent) {
    // Nested inside an <AdCard>'s <Link> on listing grids — stop the click
    // from also triggering the card's navigation.
    event?.preventDefault();
    event?.stopPropagation();

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

  const heart = (size: number) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={favorited ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 21s-6.7-4.35-9.3-8.1C1 10.1 1.6 6.6 4.5 5.1 6.7 4 9.2 4.7 12 7.3 14.8 4.7 17.3 4 19.5 5.1c2.9 1.5 3.5 5 1.8 7.8C18.7 16.65 12 21 12 21Z" />
    </svg>
  );

  if (variant === "icon") {
    return (
      <button
        type="button"
        aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
        onClick={toggle}
        disabled={pending}
        className={`flex items-center justify-center rounded-full transition-colors active:scale-95 disabled:opacity-50 ${
          compact
            ? "bg-card/80 h-8 w-8 shadow-sm backdrop-blur-md"
            : "hover:bg-muted h-12 w-12"
        } ${favorited ? "text-destructive" : "text-muted-foreground"}`}
      >
        {heart(compact ? 16 : 20)}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      className={`flex items-center gap-1.5 rounded-full border px-4 py-2.5 text-sm font-medium disabled:opacity-50 ${
        favorited
          ? "bg-primary text-primary-foreground border-primary"
          : "border-border"
      }`}
    >
      {heart(20)}
      {favorited ? "Favorited" : "Favorite"}
    </button>
  );
}
