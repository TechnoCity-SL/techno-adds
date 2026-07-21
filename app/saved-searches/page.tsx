import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { listSavedSearches } from "@/lib/saved-searches/manage";
import { SavedSearchList } from "@/components/organisms/SavedSearchList";
import { BackButton } from "@/components/molecules/BackButton";
import { BottomNavBar } from "@/components/organisms/BottomNavBar";

export default async function SavedSearchesPage() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) redirect("/login?next=/saved-searches");

  const searches = await listSavedSearches(authData.user.id);

  return (
    <div className="pb-24 md:pb-8">
      <header className="bg-card sticky top-0 z-20 shadow-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-2 py-1">
          <div className="flex items-center gap-1">
            <BackButton />
            <h1 className="text-primary text-lg font-bold">Saved Searches</h1>
          </div>
          <Link
            href="/post-ad"
            className="bg-primary text-primary-foreground rounded-full px-4 py-2 text-sm font-semibold transition-transform active:scale-95"
          >
            Post Ad
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6">
        <SavedSearchList
          initialSearches={searches.map((s) => ({
            id: s.id,
            query: s.query,
            createdAt: s.createdAt.toISOString(),
          }))}
        />
      </main>

      <BottomNavBar />
    </div>
  );
}
