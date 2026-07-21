"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/search", label: "Search" },
  { href: "/my-ads", label: "My Ads" },
  { href: "/messages", label: "Chat" },
  { href: "/account", label: "Account" },
] as const;

const ICON_PATHS: Record<(typeof NAV_ITEMS)[number]["href"], React.ReactNode> =
  {
    "/": (
      <path d="M3 11.5 12 4l9 7.5M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" />
    ),
    "/search": (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m21 21-4.3-4.3" />
      </>
    ),
    "/my-ads": <path d="M4 7h16M4 12h16M4 17h10" />,
    "/messages": (
      <path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    ),
    "/account": (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
      </>
    ),
  };

// Mobile-only fixed bottom nav (Stitch mockups hide this at `md:` and up).
// Wired in per-page as each page is reskinned, not globally, since several
// flows (post-ad wizard, auth, chat thread, admin) have their own chrome.
export function BottomNavBar() {
  const pathname = usePathname();

  return (
    <nav className="bg-card border-border fixed inset-x-0 bottom-0 z-20 flex items-center justify-around border-t px-2 pt-2 pb-4 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] md:hidden">
      {NAV_ITEMS.map((item) => {
        const active =
          item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-0.5 rounded-xl px-3 py-1 text-[11px] font-medium transition-colors ${
              active
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground"
            }`}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {ICON_PATHS[item.href]}
            </svg>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
