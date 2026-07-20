import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ListingPageTemplate } from "@/components/templates/ListingPageTemplate";
import { SaveSearchButton } from "@/components/molecules/SaveSearchButton";
import type { AdSort } from "@/lib/ads/list-ads";

export const revalidate = 60;

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; sort?: string; q?: string }>;
}) {
  const sp = await searchParams;

  let saveSearchBar = null;
  if (sp.q) {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();
    saveSearchBar = (
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 pt-4">
        <SaveSearchButton
          query={sp.q}
          isAuthenticated={authData.user !== null}
        />
        <Link href="/saved-searches" className="text-muted-foreground text-sm">
          My saved searches →
        </Link>
      </div>
    );
  }

  return (
    <>
      {saveSearchBar}
      <ListingPageTemplate
        query={sp.q}
        page={Number(sp.page) || 1}
        sort={(sp.sort as AdSort) || (sp.q ? "relevance" : "newest")}
        basePath="/search"
      />
    </>
  );
}
