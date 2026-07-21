"use client";

import { useState } from "react";

interface ShareButtonProps {
  title: string;
  variant?: "icon" | "text";
}

export function ShareButton({ title, variant = "icon" }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // user cancelled the native share sheet — not an error
      }
      return;
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (variant === "text") {
    return (
      <button
        type="button"
        onClick={share}
        className="text-muted-foreground hover:text-primary flex items-center gap-1 text-xs font-medium transition-colors"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <path d="m8.6 13.5 6.8 3.9M15.4 6.6 8.6 10.5" />
        </svg>
        {copied ? "Link copied!" : "Share Ad"}
      </button>
    );
  }

  return (
    <button
      type="button"
      aria-label="Share"
      onClick={share}
      className="hover:bg-muted text-muted-foreground flex h-12 w-12 items-center justify-center rounded-full transition-colors active:scale-95"
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
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <path d="m8.6 13.5 6.8 3.9M15.4 6.6 8.6 10.5" />
      </svg>
      {copied ? <span className="sr-only">Link copied</span> : null}
    </button>
  );
}
