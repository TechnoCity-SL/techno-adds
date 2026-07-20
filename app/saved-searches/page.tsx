import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { listSavedSearches } from "@/lib/saved-searches/manage";
import { SavedSearchList } from "@/components/organisms/SavedSearchList";

export default async function SavedSearchesPage() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) redirect("/login?next=/saved-searches");

  const searches = await listSavedSearches(authData.user.id);

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="mb-4 text-xl font-semibold">Saved Searches</h1>
      <SavedSearchList
        initialSearches={searches.map((s) => ({
          id: s.id,
          query: s.query,
          createdAt: s.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
