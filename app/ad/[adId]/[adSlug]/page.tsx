import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAdForViewing } from "@/lib/ads/get-ad";
import { isFavorited } from "@/lib/ads/favorites";
import { listAds } from "@/lib/ads/list-ads";
import { buildImageUrl } from "@/lib/cloudinary/url";
import { safeJsonLd } from "@/lib/seo/json-ld";
import { SiteHeader } from "@/components/organisms/SiteHeader";
import { AdGallery } from "@/components/organisms/AdGallery";
import { AdCard } from "@/components/molecules/AdCard";
import { ShareButton } from "@/components/molecules/ShareButton";
import { FavoriteButton } from "@/components/molecules/FavoriteButton";
import { MessageSellerButton } from "@/components/molecules/MessageSellerButton";
import { ReportButton } from "@/components/molecules/ReportButton";

export const revalidate = 300;

const TIER_BADGES: Record<string, { label: string; className: string }> = {
  top: { label: "Top Ad", className: "bg-tier-top text-tier-top-foreground" },
  super: {
    label: "Super Ad",
    className: "bg-tier-super text-tier-super-foreground",
  },
};

export default async function AdDetailPage({
  params,
}: {
  params: Promise<{ adId: string; adSlug: string }>;
}) {
  const { adId } = await params;

  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const viewerId = authData.user?.id ?? null;

  const detail = await getAdForViewing(adId, viewerId);
  if (!detail) notFound();

  const { ad, category, location, attributes, images, seller, sellerPhones } =
    detail;
  const [favorited, { ads: similarAdsRaw }] = await Promise.all([
    viewerId ? isFavorited(viewerId, adId) : Promise.resolve(false),
    listAds({ categoryId: ad.categoryId, sort: "newest", pageSize: 5 }),
  ]);
  const similarAds = similarAdsRaw.filter((a) => a.id !== ad.id).slice(0, 4);

  const galleryImages = images.map((img) => ({
    id: img.id,
    fullUrl: buildImageUrl(
      img.cloudinaryPublicId,
      "w_1200,h_900,c_fill,f_auto,q_auto",
    ),
    thumbUrl: buildImageUrl(
      img.cloudinaryPublicId,
      "w_160,h_160,c_fill,f_auto,q_auto",
    ),
  }));

  const isOwnAd = viewerId !== null && viewerId === ad.userId;
  const badge = TIER_BADGES[ad.listingTier];
  const memberSince = seller ? new Date(seller.createdAt).getFullYear() : null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: ad.title,
    description: ad.description,
    image: images.map((img) => buildImageUrl(img.cloudinaryPublicId)),
    offers: {
      "@type": "Offer",
      price: ad.price,
      priceCurrency: "LKR",
      availability: "https://schema.org/InStock",
      itemCondition:
        ad.condition === "new"
          ? "https://schema.org/NewCondition"
          : "https://schema.org/UsedCondition",
    },
  };

  const sellerCard = (
    <div className="bg-card border-border rounded-xl border p-6 shadow-md">
      <div className="mb-6">
        <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
          Asking Price
        </span>
        <div className="text-primary mt-1 text-2xl font-bold">
          Rs. {ad.price.toLocaleString()}
        </div>
        {ad.isNegotiable ? (
          <div className="text-muted-foreground text-xs">(Negotiable)</div>
        ) : null}
      </div>

      {sellerPhones.length > 0 && !isOwnAd ? (
        <div className="flex flex-col gap-3">
          <a
            href={`tel:${sellerPhones[0]}`}
            className="bg-primary text-primary-foreground flex h-12 items-center justify-center gap-2 rounded-xl text-sm font-bold shadow-sm transition-transform active:scale-95"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92Z" />
            </svg>
            Call Seller
          </a>
          <a
            href={`https://wa.me/${sellerPhones[0].replace("+", "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[#25D366] text-sm font-bold text-white shadow-sm transition-transform active:scale-95"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            WhatsApp
          </a>
          <MessageSellerButton
            adId={ad.id}
            isAuthenticated={viewerId !== null}
            isOwnAd={isOwnAd}
          />
        </div>
      ) : (
        <p className="text-muted-foreground text-xs">
          {isOwnAd ? "This is your ad." : "No verified phone number available."}
        </p>
      )}

      <div className="border-border mt-6 flex items-center gap-3 border-t pt-6">
        <div className="bg-primary text-primary-foreground relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full text-xl font-bold">
          {seller?.avatarUrl ? (
            // avatarUrl is an arbitrary external URL (e.g. a future OAuth profile
            // picture), not guaranteed to be on Cloudinary, so it can't go through
            // next/image's remotePatterns allowlist (next.config.ts only allows
            // res.cloudinary.com).
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={seller.avatarUrl}
              alt={seller.displayName}
              className="h-full w-full object-cover"
            />
          ) : (
            (seller?.displayName?.[0] ?? "?").toUpperCase()
          )}
        </div>
        <div>
          <div className="flex items-center gap-1">
            <h4 className="text-sm font-semibold">{seller?.displayName}</h4>
            {sellerPhones.length > 0 ? (
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
            ) : null}
          </div>
          <p className="text-muted-foreground text-xs">
            {sellerPhones.length > 0 ? "Verified Seller" : "Member"}
            {memberSince ? ` since ${memberSince}` : ""}
          </p>
        </div>
      </div>
    </div>
  );

  const safetyTipsCard = (
    <div className="bg-accent border-border rounded-xl border p-6">
      <div className="text-primary mb-3 flex items-center gap-2">
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
          <path d="M12 9v4M12 17h.01" />
          <path d="M10.29 3.86 1.82 18a1 1 0 0 0 .86 1.5h18.64a1 1 0 0 0 .86-1.5L13.71 3.86a1 1 0 0 0-1.72 0Z" />
        </svg>
        <span className="text-sm font-bold">Safety Tips</span>
      </div>
      <ul className="text-muted-foreground list-disc space-y-2 pl-4 text-xs">
        <li>Meet the seller in a safe, public place.</li>
        <li>Inspect the item thoroughly before paying.</li>
        <li>Never pay in advance via bank transfer.</li>
        <li>Check the seller&apos;s verification badge.</li>
      </ul>
    </div>
  );

  const actionsRow = (
    <div className="flex justify-center gap-6 py-2">
      <ShareButton title={ad.title} variant="text" />
      <FavoriteButton
        adId={ad.id}
        initialFavorited={favorited}
        isAuthenticated={viewerId !== null}
        variant="pill"
      />
      <ReportButton
        targetType="ad"
        targetId={ad.id}
        isAuthenticated={viewerId !== null}
      />
    </div>
  );

  return (
    <div className="min-h-screen pb-32 lg:pb-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
      />

      <SiteHeader />

      <main className="mx-auto max-w-7xl px-4 py-6">
        <nav className="text-muted-foreground mb-4 flex flex-wrap items-center gap-1 text-xs">
          <Link href="/" className="hover:text-primary">
            Home
          </Link>
          {category ? (
            <>
              <span>›</span>
              <Link href={`/${category.slug}`} className="hover:text-primary">
                {category.nameEn}
              </Link>
            </>
          ) : null}
          <span>›</span>
          <span className="text-foreground font-semibold">{ad.title}</span>
        </nav>

        <div className="lg:flex lg:items-start lg:gap-8">
          {/* Main column */}
          <div className="lg:w-[65%]">
            <AdGallery images={galleryImages} alt={ad.title} badge={badge} />

            <section className="bg-card mt-6 rounded-xl p-6 shadow-sm lg:p-8">
              <h1 className="text-2xl font-bold">{ad.title}</h1>
              <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-4 text-sm">
                <span className="flex items-center gap-1">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  {location?.name}
                </span>
                <span className="flex items-center gap-1">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6v6l4 2" />
                  </svg>
                  Posted{" "}
                  {ad.publishedAt
                    ? new Date(ad.publishedAt).toLocaleDateString()
                    : "recently"}
                </span>
              </div>

              {/* Price shown here too on mobile, since the full price/CTA card
                  sits below the description at narrow widths (it becomes the
                  sticky right sidebar only from lg: up) — keeps price visible
                  near the title without scrolling past specs/description. */}
              <div className="mt-4 flex items-center gap-2 lg:hidden">
                <p className="text-primary text-xl font-bold">
                  Rs. {ad.price.toLocaleString()}
                </p>
                {ad.isNegotiable ? (
                  <span className="text-muted-foreground text-sm">
                    (negotiable)
                  </span>
                ) : null}
              </div>

              {attributes.length > 0 ? (
                <div className="border-border mt-6 border-t pt-6">
                  <h2 className="mb-4 text-lg font-bold">Specifications</h2>
                  <div className="grid grid-cols-1 gap-x-12 gap-y-1 sm:grid-cols-2">
                    {attributes.map((attr) => (
                      <div
                        key={attr.key}
                        className="border-border flex items-center justify-between border-b py-2.5"
                      >
                        <span className="text-muted-foreground text-sm">
                          {attr.label}
                        </span>
                        <span className="text-sm font-bold">{attr.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="border-border mt-6 border-t pt-6">
                <h2 className="mb-4 text-lg font-bold">Description</h2>
                <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">
                  {ad.description}
                </p>
              </div>
            </section>
          </div>

          {/* Sticky sidebar (desktop) — same content stacks below the main
              column on mobile, where it's supplemented by the fixed bottom
              action bar below for immediate Call/Message access. */}
          <aside className="mt-6 flex flex-col gap-4 lg:mt-0 lg:w-[35%] lg:flex-none">
            <div className="lg:sticky lg:top-20 lg:flex lg:flex-col lg:gap-4">
              {sellerCard}
              {safetyTipsCard}
              {actionsRow}
            </div>
          </aside>
        </div>

        {similarAds.length > 0 ? (
          <section className="border-border mt-10 border-t pt-10">
            <h2 className="mb-6 text-lg font-bold">Similar Listings</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
              {similarAds.map((a) => (
                <AdCard key={a.id} {...a} isAuthenticated={viewerId !== null} />
              ))}
            </div>
          </section>
        ) : null}
      </main>

      {!isOwnAd ? (
        <div className="bg-card/90 border-border fixed inset-x-0 bottom-0 z-20 flex gap-3 border-t px-4 py-3 shadow-[0_-8px_24px_rgba(0,0,0,0.1)] backdrop-blur-md lg:hidden">
          <MessageSellerButton
            adId={ad.id}
            isAuthenticated={viewerId !== null}
            isOwnAd={isOwnAd}
          />
          {sellerPhones.length > 0 ? (
            <a
              href={`tel:${sellerPhones[0]}`}
              className="bg-primary text-primary-foreground shadow-primary/20 flex h-[52px] flex-1 items-center justify-center gap-2 rounded-xl text-sm font-bold shadow-lg transition-transform active:scale-95"
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
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92Z" />
              </svg>
              Call Seller
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
