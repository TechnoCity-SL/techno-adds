"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface UserMenuProps {
  isAuthenticated: boolean;
}

const CATEGORY_LINKS = [
  { href: "/vehicles", label: "Vehicles" },
  { href: "/property", label: "Property" },
  { href: "/techno-gadgets", label: "Techno & Gadgets" },
];

export function UserMenu({ isAuthenticated }: UserMenuProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setOpen(false);
      router.push("/");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Account menu"
        onClick={() => setOpen((prev) => !prev)}
        className="bg-secondary text-secondary-foreground hover:bg-accent flex h-10 w-10 items-center justify-center rounded-full transition-colors"
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
          <circle cx="12" cy="8" r="4" />
          <path d="M4 20c0-4.4 3.6-8 8-8s8 3.6 8 8" />
        </svg>
      </button>

      {open ? (
        <>
          <button
            aria-label="Close menu"
            className="fixed inset-0 z-30 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="border-border bg-card absolute top-full right-0 z-40 mt-2 w-56 rounded-xl border py-2 shadow-lg">
            <p className="text-muted-foreground px-4 py-1 text-xs font-semibold uppercase">
              Categories
            </p>
            {CATEGORY_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="hover:bg-muted block px-4 py-2 text-sm"
              >
                {link.label}
              </Link>
            ))}
            <div className="border-border my-2 border-t" />
            {isAuthenticated ? (
              <>
                <Link
                  href="/my-ads"
                  onClick={() => setOpen(false)}
                  className="hover:bg-muted block px-4 py-2 text-sm"
                >
                  My Ads
                </Link>
                <Link
                  href="/messages"
                  onClick={() => setOpen(false)}
                  className="hover:bg-muted block px-4 py-2 text-sm"
                >
                  Messages
                </Link>
                <Link
                  href="/saved-searches"
                  onClick={() => setOpen(false)}
                  className="hover:bg-muted block px-4 py-2 text-sm"
                >
                  Saved Searches
                </Link>
                <Link
                  href="/account"
                  onClick={() => setOpen(false)}
                  className="hover:bg-muted block px-4 py-2 text-sm"
                >
                  Account Settings
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="text-destructive hover:bg-muted block w-full px-4 py-2 text-left text-sm disabled:opacity-50"
                >
                  {loggingOut ? "Logging out..." : "Log out"}
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="hover:bg-muted block px-4 py-2 text-sm"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setOpen(false)}
                  className="hover:bg-muted block px-4 py-2 text-sm"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
