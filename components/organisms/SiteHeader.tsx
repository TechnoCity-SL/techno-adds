import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/atoms/Logo";
import { SearchBar } from "@/components/molecules/SearchBar";
import { UserMenu } from "@/components/molecules/UserMenu";

// The "browse chrome" header (logo + menu + search) — used only on the
// public discovery pages (home, category/location listing, search). Every
// other page/flow (post-ad, auth, chat thread, admin, checkout) has its own
// page-specific header content in the Stitch designs, so this is
// deliberately not global in the root layout.
export async function SiteHeader() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const isAuthenticated = data.user !== null;

  return (
    <header className="bg-card sticky top-0 z-20 shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/">
          <Logo className="h-7 w-auto" />
        </Link>
        {/* Inline search on desktop, matching the desktop Stitch header —
            mobile gets its own full-width row below instead (see bottom). */}
        <div className="hidden max-w-xl flex-1 lg:block">
          <SearchBar />
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/post-ad"
            className="bg-primary text-primary-foreground rounded-full px-4 py-2 text-sm font-semibold transition-transform active:scale-95"
          >
            Post Ad
          </Link>
          <UserMenu isAuthenticated={isAuthenticated} />
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 pb-3 lg:hidden">
        <SearchBar />
      </div>
    </header>
  );
}
