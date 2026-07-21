import Link from "next/link";
import { eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { db, schema } from "@/lib/db/postgres-client";
import { ListingPageTemplate } from "@/components/templates/ListingPageTemplate";
import { SaveSearchButton } from "@/components/molecules/SaveSearchButton";
import { listingFiltersSchema } from "@/lib/validation/ads";
import type { AdSort } from "@/lib/ads/list-ads";

export const revalidate = 60;

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    sort?: string;
    q?: string;
    location?: string;
    minPrice?: string;
    maxPrice?: string;
    condition?: string | string[];
  }>;
}) {
  const sp = await searchParams;
  const filters = listingFiltersSchema.parse(sp);

  const location = sp.location
    ? (
        await db
          .select()
          .from(schema.locations)
          .where(eq(schema.locations.id, sp.location))
      )[0]
    : undefined;

  let saveSearchBar = null;
  if (sp.q) {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();
    saveSearchBar = (
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 pt-4">
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
    <ListingPageTemplate
      query={sp.q}
      locationId={location?.id}
      locationName={location?.name}
      page={Number(sp.page) || 1}
      sort={(sp.sort as AdSort) || (sp.q ? "relevance" : "newest")}
      basePath="/search"
      minPrice={filters.minPrice}
      maxPrice={filters.maxPrice}
      condition={filters.condition}
      extraQueryParams={
        location ? `&location=${encodeURIComponent(location.id)}` : ""
      }
    >
      {saveSearchBar}
    </ListingPageTemplate>
  );
}
