import Link from "next/link";
import Image from "next/image";
import { slugify } from "@/lib/utils";
import { buildImageUrl } from "@/lib/cloudinary/url";

export interface AdCardProps {
  id: string;
  title: string;
  price: number;
  isNegotiable: boolean;
  condition: string;
  thumbnailPublicId: string | null;
  listingTier?: string;
}

const TIER_BADGES: Record<string, { label: string; className: string }> = {
  top: { label: "⭐ Top", className: "bg-amber-500 text-white" },
  super: { label: "👑 Super", className: "bg-purple-600 text-white" },
};

export function AdCard({
  id,
  title,
  price,
  isNegotiable,
  condition,
  thumbnailPublicId,
  listingTier = "standard",
}: AdCardProps) {
  const slug = slugify(title);
  const thumbnailUrl = thumbnailPublicId
    ? buildImageUrl(thumbnailPublicId, "w_400,h_300,c_fill,f_auto,q_auto")
    : null;
  const badge = TIER_BADGES[listingTier];

  return (
    <Link
      href={`/ad/${id}/${slug}`}
      className={`border-border flex flex-col overflow-hidden rounded-md border ${
        listingTier === "super" ? "ring-2 ring-purple-500" : ""
      }`}
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
            className={`absolute top-2 left-2 rounded-md px-2 py-0.5 text-xs font-semibold ${badge.className}`}
          >
            {badge.label}
          </span>
        ) : null}
      </div>
      <div className="flex flex-col gap-1 p-3">
        <p className="text-primary text-base font-semibold">
          Rs. {price.toLocaleString()}
        </p>
        <p className="line-clamp-2 text-sm">{title}</p>
        <p className="text-muted-foreground text-xs capitalize">
          {condition}
          {isNegotiable ? " · Negotiable" : ""}
        </p>
      </div>
    </Link>
  );
}
