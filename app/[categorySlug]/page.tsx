import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db/postgres-client";
import { ListingPageTemplate } from "@/components/templates/ListingPageTemplate";
import type { AdSort } from "@/lib/ads/list-ads";

export const revalidate = 60;

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ categorySlug: string }>;
  searchParams: Promise<{ page?: string; sort?: string; q?: string }>;
}) {
  const { categorySlug } = await params;
  const sp = await searchParams;

  const [category] = await db
    .select()
    .from(schema.categories)
    .where(eq(schema.categories.slug, categorySlug));
  if (!category) notFound();

  return (
    <ListingPageTemplate
      categoryId={category.id}
      categoryName={category.nameEn}
      query={sp.q}
      page={Number(sp.page) || 1}
      sort={(sp.sort as AdSort) || "newest"}
      basePath={`/${categorySlug}`}
    />
  );
}
