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
}

export function AdCard({
  id,
  title,
  price,
  isNegotiable,
  condition,
  thumbnailPublicId,
}: AdCardProps) {
  const slug = slugify(title);
  const thumbnailUrl = thumbnailPublicId
    ? buildImageUrl(thumbnailPublicId, "w_400,h_300,c_fill,f_auto,q_auto")
    : null;

  return (
    <Link
      href={`/ad/${id}/${slug}`}
      className="border-border flex flex-col overflow-hidden rounded-md border"
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
