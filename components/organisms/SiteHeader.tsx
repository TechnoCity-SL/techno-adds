import Link from "next/link";
import { SearchBar } from "@/components/molecules/SearchBar";

export function SiteHeader() {
  return (
    <header className="border-border bg-background sticky top-0 z-20 border-b">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="text-primary text-lg font-bold">
            TechnoAds
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/my-ads"
              className="border-border rounded-md border px-3 py-2 text-sm font-medium"
            >
              My Ads
            </Link>
            <Link
              href="/messages"
              className="border-border rounded-md border px-3 py-2 text-sm font-medium"
            >
              Messages
            </Link>
            <Link
              href="/post-ad"
              className="bg-primary text-primary-foreground rounded-md px-3 py-2 text-sm font-medium"
            >
              Post an Ad
            </Link>
          </div>
        </div>
        <SearchBar />
      </div>
    </header>
  );
}
