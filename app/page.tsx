import Link from "next/link";
import { sql } from "drizzle-orm";
import { AdCard } from "@/components/molecules/AdCard";
import { Logo } from "@/components/atoms/Logo";
import { SiteHeader } from "@/components/organisms/SiteHeader";
import { BottomNavBar } from "@/components/organisms/BottomNavBar";
import { SuperAdsCarousel } from "@/components/organisms/SuperAdsCarousel";
import { listAds, listFeaturedAds } from "@/lib/ads/list-ads";
import { listFavoritedAdIds } from "@/lib/ads/favorites";
import { buildImageUrl } from "@/lib/cloudinary/url";
import { createClient } from "@/lib/supabase/server";
import { db, schema } from "@/lib/db/postgres-client";
import { slugify } from "@/lib/utils";

export const revalidate = 60;

const CATEGORY_TILES = [
  {
    href: "/vehicles",
    id: "vehicles",
    label: "Vehicles",
    iconBg: "bg-secondary",
    iconColor: "text-primary",
    icon: (
      <path d="M5 17a2 2 0 1 0 4 0 2 2 0 0 0-4 0Zm10 0a2 2 0 1 0 4 0 2 2 0 0 0-4 0ZM5 17H3v-4l2-5h11l3 5v4h-2M9 17h6" />
    ),
  },
  {
    href: "/property",
    id: "property",
    label: "Property",
    iconBg: "bg-tier-super/15",
    iconColor: "text-tier-super",
    icon: <path d="m3 11 9-7 9 7v9a1 1 0 0 1-1 1h-4v-6H8v6H4a1 1 0 0 1-1-1z" />,
  },
  {
    href: "/techno-gadgets",
    id: "techno-gadgets",
    label: "Techno",
    iconBg: "bg-tertiary",
    iconColor: "text-tertiary-foreground",
    icon: (
      <>
        <rect x="7" y="2" width="10" height="20" rx="2" />
        <path d="M11 18h2" />
      </>
    ),
  },
] as const;

async function getCategoryCounts(): Promise<Record<string, number>> {
  const rows = (await db.execute(sql`
    select category_id, count(*) as count
    from ads
    where status = 'active'
    group by category_id
  `)) as unknown as { category_id: string; count: string }[];
  return Object.fromEntries(rows.map((r) => [r.category_id, Number(r.count)]));
}

export default async function Home() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const isAuthenticated = authData.user !== null;

  const [featuredAds, { ads: recentAds }, categoryCounts, locations] =
    await Promise.all([
      listFeaturedAds(undefined, 6),
      listAds({ sort: "newest", pageSize: 8 }),
      getCategoryCounts(),
      db.select().from(schema.locations),
    ]);

  const favoritedIds = isAuthenticated
    ? await listFavoritedAdIds(
        authData.user!.id,
        [...featuredAds, ...recentAds].map((a) => a.id),
      )
    : new Set<string>();

  const superAdSlides = featuredAds.map((ad) => ({
    id: ad.id,
    href: `/ad/${ad.id}/${slugify(ad.title)}`,
    title: ad.title,
    price: ad.price,
    imageUrl: ad.thumbnailPublicId
      ? buildImageUrl(ad.thumbnailPublicId, "w_1200,h_600,c_fill,f_auto,q_auto")
      : null,
  }));

  return (
    <div className="pb-24 md:pb-8">
      <SiteHeader />

      <main className="mx-auto max-w-7xl">
        {/* Mobile hero */}
        <section className="from-primary to-secondary text-primary-foreground relative overflow-hidden bg-gradient-to-br px-4 py-8 lg:hidden">
          <div className="relative z-10">
            <h1 className="text-2xl font-bold">
              Buy &amp; Sell Everything in Sri Lanka
            </h1>
            <p className="mt-2 max-w-xs text-sm opacity-90">
              Join the most trusted marketplace for electronics, vehicles, and
              real estate.
            </p>
          </div>
          <svg
            width="160"
            height="160"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="pointer-events-none absolute -right-12 -bottom-12 opacity-10"
          >
            <path d="M6 2 4 6v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6l-2-4Zm2 8a4 4 0 0 0 8 0" />
          </svg>
        </section>

        {/* Desktop hero — sits directly on the page background (no filled
            card), matching the Figma design: a plain centered headline +
            search over the page's own bg-background. */}
        <section className="relative mt-6 hidden px-8 py-16 text-center lg:block">
          <div className="relative z-10 mx-auto max-w-3xl space-y-6">
            <h2 className="text-foreground text-4xl font-bold">
              The smarter way to buy and sell in Sri Lanka
            </h2>
            <p className="text-muted-foreground mx-auto max-w-xl text-base">
              Verified sellers, secure payments, and a seamless marketplace
              experience for high-trust transactions.
            </p>
            <form
              action="/search"
              method="get"
              className="mx-auto flex max-w-md flex-col items-center gap-3 md:flex-row"
            >
              <div className="relative w-full md:flex-1">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-primary pointer-events-none absolute top-1/2 left-4 -translate-y-1/2"
                >
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <select
                  name="location"
                  defaultValue=""
                  className="text-foreground h-14 w-full rounded-2xl border-none bg-white pr-4 pl-12 shadow-xl"
                >
                  <option value="">Select Location</option>
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                className="bg-primary text-primary-foreground h-14 rounded-2xl px-10 font-bold whitespace-nowrap shadow-xl transition-shadow hover:shadow-2xl"
              >
                Find Deals
              </button>
            </form>
          </div>
        </section>

        {/* Category tiles — mobile only; desktop uses the split panel below */}
        <section className="px-4 py-6 lg:hidden">
          <div className="grid grid-cols-3 gap-3">
            {CATEGORY_TILES.map((tile) => (
              <Link
                key={tile.href}
                href={tile.href}
                className="border-border hover:border-primary bg-card group flex flex-col items-center justify-center gap-2 rounded-xl border p-4 shadow-sm transition-colors"
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-full ${tile.iconBg} transition-transform group-hover:scale-110`}
                >
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={tile.iconColor}
                  >
                    {tile.icon}
                  </svg>
                </div>
                <span className="text-xs font-semibold">{tile.label}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Trust strip */}
        <section className="bg-accent mx-4 mb-6 flex flex-wrap items-center justify-center gap-4 rounded-xl px-4 py-3 lg:mx-0 lg:mt-6 lg:justify-center lg:gap-8 lg:rounded-2xl lg:py-6">
          <div className="flex items-center gap-2 text-xs font-semibold lg:text-sm">
            <span className="bg-card/70 flex h-7 w-7 items-center justify-center rounded-full">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-primary"
              >
                <path d="M12 2 4 5v6c0 5 3.5 8.5 8 11 4.5-2.5 8-6 8-11V5l-8-3Z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </span>
            Verified Sellers
          </div>
          <div className="bg-border hidden h-4 w-px lg:block" />
          <div className="flex items-center gap-2 text-xs font-semibold lg:text-sm">
            <span className="bg-card/70 flex h-7 w-7 items-center justify-center rounded-full">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-primary"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v8M8 12h8" />
              </svg>
            </span>
            Free Posting
          </div>
          <div className="bg-border hidden h-4 w-px lg:block" />
          <div className="flex items-center gap-2 text-xs font-semibold lg:text-sm">
            <span className="bg-card/70 flex h-7 w-7 items-center justify-center rounded-full">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-primary"
              >
                <rect x="3" y="11" width="18" height="10" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </span>
            Secure Transactions
          </div>
        </section>

        {/* Mobile: horizontal-scroll Featured carousel */}
        {featuredAds.length > 0 ? (
          <section className="py-2 lg:hidden">
            <div className="flex items-center justify-between px-4 pb-2">
              <h2 className="text-primary text-lg font-bold">Featured</h2>
              <Link
                href="/search?sort=newest"
                className="text-primary text-xs font-semibold"
              >
                View All
              </Link>
            </div>
            <div className="flex [scrollbar-width:none] gap-3 overflow-x-auto px-4 pb-2 [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              {featuredAds.map((ad) => (
                <div key={ad.id} className="w-44 flex-shrink-0">
                  <AdCard
                    {...ad}
                    isAuthenticated={isAuthenticated}
                    isFavorited={favoritedIds.has(ad.id)}
                  />
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {/* Desktop: Explore Categories + Super Ad hero split panel */}
        <section className="hidden gap-6 py-10 lg:grid lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-4">
            <h3 className="text-xl font-bold">Explore Categories</h3>
            <div className="flex flex-col gap-3">
              {CATEGORY_TILES.map((tile) => (
                <Link
                  key={tile.href}
                  href={tile.href}
                  className="border-border hover:border-primary group flex items-center rounded-2xl border p-4 transition-all hover:shadow-lg"
                >
                  <div
                    className={`group-hover:text-primary-foreground group-hover:bg-primary flex h-12 w-12 items-center justify-center rounded-xl transition-colors ${tile.iconBg} ${tile.iconColor}`}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      {tile.icon}
                    </svg>
                  </div>
                  <div className="ml-4 flex-1">
                    <p className="text-sm font-semibold">{tile.label}</p>
                    <p className="text-muted-foreground text-xs">
                      {(categoryCounts[tile.id] ?? 0).toLocaleString()}+
                      Listings
                    </p>
                  </div>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-outline group-hover:text-primary"
                  >
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </Link>
              ))}
            </div>
          </div>

          {superAdSlides.length > 0 ? (
            <div className="lg:col-span-8">
              <SuperAdsCarousel slides={superAdSlides} />
            </div>
          ) : null}
        </section>

        <section className="px-4 py-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold lg:text-xl">Recently Posted</h2>
            <Link
              href="/search"
              className="text-primary hidden text-sm font-semibold lg:block"
            >
              View All →
            </Link>
          </div>
          {recentAds.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">
              No ads posted yet — be the first!
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-6">
              {recentAds.map((ad) => (
                <AdCard
                  key={ad.id}
                  {...ad}
                  isAuthenticated={isAuthenticated}
                  isFavorited={favoritedIds.has(ad.id)}
                />
              ))}
            </div>
          )}
          <Link
            href="/search"
            className="border-primary text-primary hover:bg-accent mt-6 block w-full rounded-xl border-2 py-3 text-center text-sm font-semibold transition-colors lg:hidden"
          >
            Show More Results
          </Link>
        </section>

        {/* Mobile footer: logo + About/Support columns, matching the
            mobile Stitch export (no categories/company columns there). */}
        <footer className="border-border mt-6 border-t px-4 py-8 lg:hidden">
          <Logo className="h-6 w-auto opacity-60 grayscale" />
          <div className="mt-6 grid grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <h4 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                About
              </h4>
              <Link href="/" className="text-muted-foreground text-sm">
                How it works
              </Link>
              <Link href="/" className="text-muted-foreground text-sm">
                Safety Tips
              </Link>
              <Link href="/" className="text-muted-foreground text-sm">
                Contact Us
              </Link>
            </div>
            <div className="flex flex-col gap-2">
              <h4 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                Support
              </h4>
              <Link href="/" className="text-muted-foreground text-sm">
                Privacy Policy
              </Link>
              <Link href="/" className="text-muted-foreground text-sm">
                Terms of Use
              </Link>
              <Link href="/" className="text-muted-foreground text-sm">
                Help Center
              </Link>
            </div>
          </div>
          <p className="text-muted-foreground border-border mt-8 border-t pt-4 text-center text-xs opacity-60">
            © 2026 TechnoAds Sri Lanka. All rights reserved.
          </p>
        </footer>

        {/* Desktop footer: brand blurb + socials + Categories/Company/Support
            columns, matching the desktop Stitch export's 5-column layout. */}
        <footer className="border-border bg-card mt-12 hidden border-t px-8 py-16 lg:block">
          <div className="grid grid-cols-5 gap-8">
            <div className="col-span-2 flex flex-col gap-6">
              <h3 className="text-primary text-xl font-bold">TechnoAds</h3>
              <p className="text-muted-foreground max-w-xs text-sm">
                Building the most trusted marketplace for premium items.
                Transact with confidence across our nationwide network of
                verified users.
              </p>
              <div className="flex gap-4">
                {[
                  <g key="globe">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M2 12h20M12 2a15 15 0 0 1 4 10 15 15 0 0 1-4 10 15 15 0 0 1-4-10 15 15 0 0 1 4-10Z" />
                  </g>,
                  <path key="play" d="M8 5v14l11-7z" />,
                  <path
                    key="megaphone"
                    d="M3 11v2a1 1 0 0 0 1 1h2l6 4V6l-6 4H4a1 1 0 0 0-1 1Zm14-5a9 9 0 0 1 0 12M15 9a5 5 0 0 1 0 6"
                  />,
                ].map((path, i) => (
                  <span
                    key={i}
                    className="border-border text-muted-foreground hover:bg-primary hover:text-primary-foreground flex h-10 w-10 items-center justify-center rounded-full border transition-colors"
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      {path}
                    </svg>
                  </span>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <h4 className="text-xs font-semibold tracking-wider uppercase">
                Categories
              </h4>
              {CATEGORY_TILES.map((tile) => (
                <Link
                  key={tile.href}
                  href={tile.href}
                  className="text-muted-foreground hover:text-primary text-sm"
                >
                  {tile.label === "Techno" ? "Techno & Gadgets" : tile.label}
                </Link>
              ))}
            </div>
            <div className="flex flex-col gap-4">
              <h4 className="text-xs font-semibold tracking-wider uppercase">
                Company
              </h4>
              <Link href="/" className="text-muted-foreground text-sm">
                About Us
              </Link>
              <Link href="/" className="text-muted-foreground text-sm">
                Careers
              </Link>
              <Link href="/" className="text-muted-foreground text-sm">
                Press
              </Link>
              <Link href="/" className="text-muted-foreground text-sm">
                Contact Us
              </Link>
              <Link href="/" className="text-muted-foreground text-sm">
                Blog
              </Link>
            </div>
            <div className="flex flex-col gap-4">
              <h4 className="text-xs font-semibold tracking-wider uppercase">
                Support
              </h4>
              <Link href="/" className="text-muted-foreground text-sm">
                Help Center
              </Link>
              <Link href="/" className="text-muted-foreground text-sm">
                Safety Tips
              </Link>
              <Link href="/" className="text-muted-foreground text-sm">
                Terms of Service
              </Link>
              <Link href="/" className="text-muted-foreground text-sm">
                Privacy Policy
              </Link>
            </div>
          </div>
          <p className="text-muted-foreground border-border mt-16 border-t pt-8 text-center text-xs">
            © 2026 TechnoAds Sri Lanka. All rights reserved.
          </p>
        </footer>
      </main>

      <BottomNavBar />
    </div>
  );
}
