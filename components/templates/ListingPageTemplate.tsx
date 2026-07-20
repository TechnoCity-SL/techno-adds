import Link from "next/link";
import { AdCard } from "@/components/molecules/AdCard";
import { listAds, type AdSort } from "@/lib/ads/list-ads";

interface ListingPageTemplateProps {
  categoryId?: string;
  categoryName?: string;
  locationId?: string;
  locationName?: string;
  query?: string;
  page: number;
  sort: AdSort;
  basePath: string;
}

const SORT_LABELS: Record<Exclude<AdSort, "relevance">, string> = {
  newest: "Newest",
  price_asc: "Price: Low to High",
  price_desc: "Price: High to Low",
};

export async function ListingPageTemplate({
  categoryId,
  categoryName,
  locationId,
  locationName,
  query,
  page,
  sort,
  basePath,
}: ListingPageTemplateProps) {
  const { ads, total, pageSize } = await listAds({
    categoryId,
    locationId,
    query,
    page,
    sort,
  });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const qParam = query ? `&q=${encodeURIComponent(query)}` : "";

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <h1 className="text-xl font-semibold">
        {categoryName ?? "All categories"}
        {locationName ? ` in ${locationName}` : ""}
      </h1>
      <p className="text-muted-foreground mb-4 text-sm">
        {total} ad{total === 1 ? "" : "s"} found
      </p>

      <div className="mb-4 flex flex-wrap gap-2 text-sm">
        {(Object.keys(SORT_LABELS) as (keyof typeof SORT_LABELS)[]).map((s) => (
          <Link
            key={s}
            href={`${basePath}?sort=${s}${qParam}`}
            className={`rounded-md border px-3 py-1.5 ${
              sort === s
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border"
            }`}
          >
            {SORT_LABELS[s]}
          </Link>
        ))}
      </div>

      {ads.length === 0 ? (
        <p className="text-muted-foreground py-12 text-center text-sm">
          No ads found.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {ads.map((ad) => (
            <AdCard key={ad.id} {...ad} />
          ))}
        </div>
      )}

      {totalPages > 1 ? (
        <div className="mt-6 flex justify-center gap-2 text-sm">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`${basePath}?page=${p}&sort=${sort}${qParam}`}
              className={`rounded-md border px-3 py-1.5 ${
                p === page
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border"
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
