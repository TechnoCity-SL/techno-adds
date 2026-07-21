import Link from "next/link";
import { AdCard } from "@/components/molecules/AdCard";
import { SiteHeader } from "@/components/organisms/SiteHeader";
import { BottomNavBar } from "@/components/organisms/BottomNavBar";
import { SortSelect } from "@/components/molecules/SortSelect";
import { SuperAdsCarousel } from "@/components/organisms/SuperAdsCarousel";
import { listAds, listFeaturedAds, type AdSort } from "@/lib/ads/list-ads";
import { listFavoritedAdIds } from "@/lib/ads/favorites";
import { createClient } from "@/lib/supabase/server";
import { buildImageUrl } from "@/lib/cloudinary/url";
import { slugify } from "@/lib/utils";

interface ListingPageTemplateProps {
  categoryId?: string;
  categoryName?: string;
  locationId?: string;
  locationName?: string;
  query?: string;
  page: number;
  sort: AdSort;
  basePath: string;
  minPrice?: number;
  maxPrice?: number;
  condition?: ("new" | "used")[];
  /** Extra querystring fragment (e.g. "&location=colombo") carried through
   * sort/pagination/filter links — for filters that live in the query string
   * on this basePath rather than being baked into the path itself. */
  extraQueryParams?: string;
  children?: React.ReactNode;
}

const CONDITION_OPTIONS: { value: "new" | "used"; label: string }[] = [
  { value: "new", label: "New" },
  { value: "used", label: "Used" },
];

// Max page-number links shown around the current page before collapsing the
// rest into an ellipsis — keeps a 42-page result set from rendering 42 pills.
const PAGINATION_WINDOW = 1;

export async function ListingPageTemplate({
  categoryId,
  categoryName,
  locationId,
  locationName,
  query,
  page,
  sort,
  basePath,
  minPrice,
  maxPrice,
  condition = [],
  extraQueryParams = "",
  children,
}: ListingPageTemplateProps) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const isAuthenticated = authData.user !== null;

  const [{ ads, total, pageSize }, featuredAds] = await Promise.all([
    listAds({
      categoryId,
      locationId,
      query,
      page,
      sort,
      minPrice,
      maxPrice,
      condition,
    }),
    categoryId ? listFeaturedAds(categoryId) : Promise.resolve([]),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // Carries every active filter/search param except `sort` and `page`, so
  // switching the sort or paging never silently drops a filter.
  const filterQueryString =
    (query ? `&q=${encodeURIComponent(query)}` : "") +
    (minPrice !== undefined ? `&minPrice=${minPrice}` : "") +
    (maxPrice !== undefined ? `&maxPrice=${maxPrice}` : "") +
    condition.map((c) => `&condition=${c}`).join("") +
    extraQueryParams;

  const favoritedIds = isAuthenticated
    ? await listFavoritedAdIds(
        authData.user!.id,
        [...featuredAds, ...ads].map((a) => a.id),
      )
    : new Set<string>();

  const featuredSlides = featuredAds.map((ad) => ({
    id: ad.id,
    href: `/ad/${ad.id}/${slugify(ad.title)}`,
    title: ad.title,
    price: ad.price,
    imageUrl: ad.thumbnailPublicId
      ? buildImageUrl(ad.thumbnailPublicId, "w_1200,h_600,c_fill,f_auto,q_auto")
      : null,
  }));

  // Extra hidden inputs so the filters <form> preserves everything it isn't
  // itself responsible for (search query, sort, location) when submitted —
  // a plain GET form, so this works without client JS.
  const preservedParams: [string, string][] = [];
  if (query) preservedParams.push(["q", query]);
  if (sort) preservedParams.push(["sort", sort]);
  for (const pair of extraQueryParams.split("&")) {
    if (!pair) continue;
    const [key, value] = pair.split("=");
    if (key && value) preservedParams.push([key, decodeURIComponent(value)]);
  }

  return (
    <div className="pb-24 md:pb-8">
      <SiteHeader />

      {children}

      <div className="mx-auto max-w-7xl px-4 pt-4">
        <nav className="text-muted-foreground mb-2 flex items-center gap-1 text-xs">
          <Link href="/" className="hover:text-primary">
            Home
          </Link>
          {categoryName ? (
            <>
              <span>›</span>
              <Link
                href={`/${basePath.split("/")[1]}`}
                className="hover:text-primary"
              >
                {categoryName}
              </Link>
            </>
          ) : null}
          {locationName ? (
            <>
              <span>›</span>
              <span className="text-foreground font-semibold">
                {locationName}
              </span>
            </>
          ) : null}
        </nav>
        <h1 className="text-xl font-bold lg:text-2xl">
          {categoryName ?? "All categories"}
          {locationName ? ` in ${locationName}` : ""}
        </h1>
        <p className="text-muted-foreground text-sm">
          Showing {total.toLocaleString()} result{total === 1 ? "" : "s"}
        </p>
      </div>

      <div className="mx-auto max-w-7xl gap-6 px-4 py-4 lg:flex lg:items-start">
        {/* Filters sidebar */}
        <aside className="mb-4 flex flex-col gap-4 lg:mb-0 lg:w-72 lg:flex-none">
          <form
            method="get"
            action={basePath}
            className="border-border bg-card rounded-xl border p-4 shadow-sm"
          >
            <input type="hidden" name="page" value="1" />
            {preservedParams.map(([key, value]) => (
              <input key={key} type="hidden" name={key} value={value} />
            ))}

            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold">Filters</h2>
              <Link
                href={basePath}
                className="text-primary text-xs font-semibold"
              >
                Clear All
              </Link>
            </div>

            <div className="mb-4">
              <label className="text-muted-foreground mb-2 block text-xs font-semibold">
                Price Range (Rs.)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  name="minPrice"
                  min={0}
                  defaultValue={minPrice}
                  placeholder="Min"
                  className="border-border w-full rounded-lg border p-2 text-sm outline-none"
                />
                <span className="text-muted-foreground">-</span>
                <input
                  type="number"
                  name="maxPrice"
                  min={0}
                  defaultValue={maxPrice}
                  placeholder="Max"
                  className="border-border w-full rounded-lg border p-2 text-sm outline-none"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="text-muted-foreground mb-2 block text-xs font-semibold">
                Condition
              </label>
              <div className="flex flex-col gap-2">
                {CONDITION_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className="flex items-center gap-3 text-sm"
                  >
                    <input
                      type="checkbox"
                      name="condition"
                      value={opt.value}
                      defaultChecked={condition.includes(opt.value)}
                      className="border-border text-primary h-4 w-4 rounded"
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="bg-primary text-primary-foreground w-full rounded-xl py-2.5 text-sm font-bold"
            >
              Apply Filters
            </button>
          </form>

          <Link
            href="/my-ads"
            className="bg-primary text-primary-foreground relative block overflow-hidden rounded-xl p-6"
          >
            <h3 className="mb-2 text-lg font-bold">Sell Faster?</h3>
            <p className="mb-4 text-sm opacity-90">
              Upgrade to Super Ad and get 10x more views.
            </p>
            <span className="text-primary inline-block rounded-full bg-white px-4 py-1.5 text-sm font-semibold">
              Learn More
            </span>
          </Link>
        </aside>

        {/* Main content */}
        <main className="min-w-0 flex-1">
          <div className="mb-4 flex justify-end">
            <SortSelect
              sort={sort}
              basePath={basePath}
              queryString={`&page=${page}${filterQueryString}`}
            />
          </div>

          {featuredSlides.length > 0 ? (
            <section className="mb-6">
              <SuperAdsCarousel slides={featuredSlides} />
            </section>
          ) : null}

          {ads.length === 0 ? (
            <p className="text-muted-foreground py-12 text-center text-sm">
              No ads found{query ? ` for "${query}"` : ""}.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {ads.map((ad) => (
                <AdCard
                  key={ad.id}
                  {...ad}
                  isAuthenticated={isAuthenticated}
                  isFavorited={favoritedIds.has(ad.id)}
                />
              ))}
            </div>
          )}

          {totalPages > 1 ? (
            <PaginationRow
              page={page}
              totalPages={totalPages}
              basePath={basePath}
              sort={sort}
              filterQueryString={filterQueryString}
            />
          ) : null}
        </main>
      </div>

      <BottomNavBar />
    </div>
  );
}

function pageHref(
  basePath: string,
  sort: AdSort,
  filterQueryString: string,
  page: number,
) {
  return `${basePath}?page=${page}&sort=${sort}${filterQueryString}`;
}

function PaginationRow({
  page,
  totalPages,
  basePath,
  sort,
  filterQueryString,
}: {
  page: number;
  totalPages: number;
  basePath: string;
  sort: AdSort;
  filterQueryString: string;
}) {
  // Always show first, last, and a small window around the current page;
  // collapse everything else into a single "…" so a 42-page result set
  // doesn't render 42 pills.
  const pages = new Set<number>([1, totalPages]);
  for (let p = page - PAGINATION_WINDOW; p <= page + PAGINATION_WINDOW; p++) {
    if (p >= 1 && p <= totalPages) pages.add(p);
  }
  const sorted = Array.from(pages).sort((a, b) => a - b);

  const items: (number | "ellipsis")[] = [];
  let prev = 0;
  for (const p of sorted) {
    if (p - prev > 1) items.push("ellipsis");
    items.push(p);
    prev = p;
  }

  const pillClass = (active: boolean) =>
    `flex h-10 w-10 items-center justify-center rounded-lg text-sm font-semibold ${
      active
        ? "bg-primary text-primary-foreground"
        : "border-border hover:bg-accent border"
    }`;

  return (
    <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
      <Link
        href={pageHref(
          basePath,
          sort,
          filterQueryString,
          Math.max(1, page - 1),
        )}
        aria-disabled={page === 1}
        className={`border-border hover:bg-accent flex h-10 w-10 items-center justify-center rounded-lg border ${page === 1 ? "pointer-events-none opacity-40" : ""}`}
      >
        ‹
      </Link>
      {items.map((item, i) =>
        item === "ellipsis" ? (
          <span key={`e-${i}`} className="text-muted-foreground px-1">
            …
          </span>
        ) : (
          <Link
            key={item}
            href={pageHref(basePath, sort, filterQueryString, item)}
            className={pillClass(item === page)}
          >
            {item}
          </Link>
        ),
      )}
      <Link
        href={pageHref(
          basePath,
          sort,
          filterQueryString,
          Math.min(totalPages, page + 1),
        )}
        aria-disabled={page === totalPages}
        className={`border-border hover:bg-accent flex h-10 w-10 items-center justify-center rounded-lg border ${page === totalPages ? "pointer-events-none opacity-40" : ""}`}
      >
        ›
      </Link>
    </div>
  );
}
