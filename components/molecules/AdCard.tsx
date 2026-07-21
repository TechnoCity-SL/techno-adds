import Link from "next/link";
import Image from "next/image";
import { slugify, relativeTime } from "@/lib/utils";
import { buildImageUrl } from "@/lib/cloudinary/url";
import { FavoriteButton } from "@/components/molecules/FavoriteButton";

export interface AdCardProps {
  id: string;
  title: string;
  price: number;
  isNegotiable: boolean;
  condition: string;
  thumbnailPublicId: string | null;
  listingTier?: string;
  locationName?: string | null;
  createdAt?: string | Date;
  isAuthenticated?: boolean;
  isFavorited?: boolean;
}

const TIER_BADGES: Record<string, { label: string; className: string }> = {
  top: { label: "Top Ad", className: "bg-tier-top text-tier-top-foreground" },
  super: {
    label: "Super Ad",
    className: "bg-tier-super text-tier-super-foreground",
  },
};

export function AdCard({
  id,
  title,
  price,
  isNegotiable,
  condition,
  thumbnailPublicId,
  listingTier = "standard",
  locationName,
  createdAt,
  isAuthenticated = false,
  isFavorited = false,
}: AdCardProps) {
  const slug = slugify(title);
  const thumbnailUrl = thumbnailPublicId
    ? buildImageUrl(thumbnailPublicId, "w_400,h_300,c_fill,f_auto,q_auto")
    : null;
  const badge = TIER_BADGES[listingTier];

  return (
    <Link
      href={`/ad/${id}/${slug}`}
      className="bg-card flex flex-col overflow-hidden rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-transform active:scale-95"
    >
      <div className="bg-muted relative aspect-4/3 w-full">
        {thumbnailUrl ? (
          <Image
            src={thumbnailUrl}
            alt={title}
            fill
            sizes="(max-width: 640px) 50vw, 25vw"
            className="object-cover"
          />
        ) : null}
        {badge ? (
          <span
            className={`absolute top-2 left-2 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase shadow-sm ${badge.className}`}
          >
            {badge.label}
          </span>
        ) : null}
        <div className="absolute top-2 right-2">
          <FavoriteButton
            adId={id}
            initialFavorited={isFavorited}
            isAuthenticated={isAuthenticated}
            variant="icon"
            compact
          />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <p className="text-primary text-lg font-bold">
          Rs. {price.toLocaleString()}
        </p>
        <p className="line-clamp-2 min-h-[32px] text-sm font-medium">{title}</p>
        <p className="text-muted-foreground text-xs capitalize">
          {condition}
          {isNegotiable ? " · Negotiable" : ""}
        </p>
        {locationName || createdAt ? (
          <div className="border-border text-muted-foreground mt-auto flex items-center gap-1 border-t pt-2 text-[10px]">
            {locationName ? (
              <span className="flex items-center gap-0.5">
                <svg
                  width="12"
                  height="12"
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
                {locationName}
              </span>
            ) : null}
            {locationName && createdAt ? <span>•</span> : null}
            {createdAt ? <span>{relativeTime(createdAt)}</span> : null}
          </div>
        ) : null}
      </div>
    </Link>
  );
}
