import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db/postgres-client";
import { ListingPageTemplate } from "@/components/templates/ListingPageTemplate";
import { listingFiltersSchema } from "@/lib/validation/ads";
import type { AdSort } from "@/lib/ads/list-ads";

export const revalidate = 60;

export default async function CategoryLocationPage({
  params,
  searchParams,
}: {
  params: Promise<{ categorySlug: string; locationSlug: string }>;
  searchParams: Promise<{
    page?: string;
    sort?: string;
    q?: string;
    minPrice?: string;
    maxPrice?: string;
    condition?: string | string[];
  }>;
}) {
  const { categorySlug, locationSlug } = await params;
  const sp = await searchParams;
  const filters = listingFiltersSchema.parse(sp);

  const [category] = await db
    .select()
    .from(schema.categories)
    .where(eq(schema.categories.slug, categorySlug));
  if (!category) notFound();

  const [location] = await db
    .select()
    .from(schema.locations)
    .where(eq(schema.locations.slug, locationSlug));
  if (!location) notFound();

  return (
    <ListingPageTemplate
      categoryId={category.id}
      categoryName={category.nameEn}
      locationId={location.id}
      locationName={location.name}
      query={sp.q}
      page={Number(sp.page) || 1}
      sort={(sp.sort as AdSort) || "newest"}
      basePath={`/${categorySlug}/${locationSlug}`}
      minPrice={filters.minPrice}
      maxPrice={filters.maxPrice}
      condition={filters.condition}
    />
  );
}
