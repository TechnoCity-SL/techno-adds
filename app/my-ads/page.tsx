import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { listOwnAds, type OwnAdItem } from "@/lib/ads/list-own-ads";
import { buildImageUrl } from "@/lib/cloudinary/url";
import { slugify } from "@/lib/utils";
import { SiteHeader } from "@/components/organisms/SiteHeader";
import { BottomNavBar } from "@/components/organisms/BottomNavBar";

function statusLabel(status: string): string {
  return status
    .split("_")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

const STATUS_BADGE: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  pending_review: "bg-amber-100 text-amber-700",
  rejected: "bg-destructive/10 text-destructive",
};

const TIER_BADGE: Record<string, string> = {
  top: "bg-tier-top text-tier-top-foreground",
  super: "bg-tier-super text-tier-super-foreground",
};

function AdRow({ ad }: { ad: OwnAdItem }) {
  const thumbnailUrl = ad.thumbnailPublicId
    ? buildImageUrl(ad.thumbnailPublicId, "w_200,h_200,c_fill,f_auto,q_auto")
    : null;
  const isRejected = ad.status === "rejected";
  const isPending = ad.status === "pending_review";
  const isBoosted = ad.listingTier !== "standard";
  const tierBadge = TIER_BADGE[ad.listingTier];

  return (
    <div
      className={`bg-card rounded-xl border p-4 shadow-sm ${
        isRejected
          ? "border-destructive/20"
          : isBoosted
            ? "border-primary"
            : "border-border"
      } ${isPending ? "opacity-80" : ""}`}
    >
      <div className="flex gap-4">
        <Link
          href={`/ad/${ad.id}/${slugify(ad.title)}`}
          className={`bg-muted relative h-24 w-24 shrink-0 overflow-hidden rounded-lg ${
            isPending || isRejected ? "grayscale" : ""
          } ${isRejected ? "opacity-50" : ""}`}
        >
          {thumbnailUrl ? (
            <Image
              src={thumbnailUrl}
              alt={ad.title}
              fill
              sizes="96px"
              className="object-cover"
            />
          ) : null}
          {tierBadge ? (
            <span
              className={`absolute top-1 left-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${tierBadge}`}
            >
              {ad.listingTier}
            </span>
          ) : null}
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <Link
              href={`/ad/${ad.id}/${slugify(ad.title)}`}
              className={`truncate text-sm font-bold ${
                isRejected ? "text-muted-foreground" : ""
              }`}
            >
              {ad.title}
            </Link>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span
              className={`text-lg font-bold ${
                isRejected ? "text-muted-foreground" : "text-primary"
              }`}
            >
              Rs. {ad.price.toLocaleString()}
            </span>
            <span
              className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
                STATUS_BADGE[ad.status] ?? "bg-muted text-muted-foreground"
              }`}
            >
              {statusLabel(ad.status)}
            </span>
          </div>

          {isPending ? (
            <p className="text-muted-foreground mt-2 text-xs italic">
              Under review by our safety team...
            </p>
          ) : null}

          {ad.status === "active" ? (
            <div className="mt-2 flex items-center justify-between gap-2">
              {isBoosted && ad.tierExpiresAt ? (
                <span className="text-muted-foreground flex items-center gap-1 text-xs">
                  <svg
                    width="14"
                    height="14"
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
                  Expires {ad.tierExpiresAt.toLocaleDateString()}
                </span>
              ) : (
                <span />
              )}
              <Link
                href={`/my-ads/${ad.id}/boost`}
                className="bg-accent text-accent-foreground flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors active:scale-95"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
                  <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
                  <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
                  <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
                </svg>
                {isBoosted ? "Extend boost" : "Boost this ad"}
              </Link>
            </div>
          ) : null}

          {isRejected ? (
            <div className="mt-2 flex items-center justify-between gap-2">
              <span className="text-destructive flex items-center gap-1 text-xs">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4M12 8h.01" />
                </svg>
                Rejected by moderators
              </span>
              <Link
                href="/post-ad"
                className="text-primary text-xs font-semibold hover:underline"
              >
                Post again
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default async function MyAdsPage() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) redirect("/login?next=/my-ads");

  const ads = await listOwnAds(authData.user.id);

  return (
    <div className="pb-24 md:pb-8">
      <SiteHeader />

      <main className="mx-auto max-w-4xl px-4 py-6">
        <div className="mb-6">
          <h1 className="text-xl font-bold">My Ads</h1>
          <p className="text-muted-foreground text-sm">
            Manage and promote your listings
          </p>
        </div>

        {ads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="bg-muted mb-6 flex h-32 w-32 items-center justify-center rounded-full">
              <svg
                width="56"
                height="56"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-primary"
              >
                <path d="M4 7h16M4 12h16M4 17h10" />
              </svg>
            </div>
            <h2 className="text-lg font-bold">No Ads Yet</h2>
            <p className="text-muted-foreground mt-2 mb-6 max-w-xs text-sm">
              Start selling your items to thousands of verified buyers across
              Sri Lanka.
            </p>
            <Link
              href="/post-ad"
              className="bg-primary text-primary-foreground rounded-xl px-8 py-3 text-sm font-bold shadow-lg transition-transform active:scale-95"
            >
              Post your first ad
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {ads.map((ad) => (
              <AdRow key={ad.id} ad={ad} />
            ))}
          </div>
        )}
      </main>

      <BottomNavBar />
    </div>
  );
}
