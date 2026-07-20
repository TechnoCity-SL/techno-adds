import { notFound } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { getAdForViewing } from "@/lib/ads/get-ad";
import { isFavorited } from "@/lib/ads/favorites";
import { buildImageUrl } from "@/lib/cloudinary/url";
import { safeJsonLd } from "@/lib/seo/json-ld";
import { FavoriteButton } from "@/components/molecules/FavoriteButton";
import { MessageSellerButton } from "@/components/molecules/MessageSellerButton";
import { ReportButton } from "@/components/molecules/ReportButton";

export const revalidate = 300;

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
  const favorited = viewerId ? await isFavorited(viewerId, adId) : false;

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

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
      />

      {images.length > 0 ? (
        <div className="bg-muted relative mb-4 aspect-4/3 w-full overflow-hidden rounded-md">
          <Image
            src={buildImageUrl(images[0].cloudinaryPublicId)}
            alt={ad.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 768px"
            priority
          />
        </div>
      ) : null}

      {images.length > 1 ? (
        <div className="mb-4 flex gap-2 overflow-x-auto">
          {images.slice(1).map((img) => (
            <div
              key={img.id}
              className="bg-muted relative h-20 w-20 shrink-0 overflow-hidden rounded-md"
            >
              <Image
                src={buildImageUrl(
                  img.cloudinaryPublicId,
                  "w_160,h_160,c_fill,f_auto,q_auto",
                )}
                alt=""
                fill
                className="object-cover"
                sizes="80px"
              />
            </div>
          ))}
        </div>
      ) : null}

      <h1 className="text-xl font-semibold">{ad.title}</h1>
      <p className="text-primary my-2 text-2xl font-bold">
        Rs. {ad.price.toLocaleString()}{" "}
        {ad.isNegotiable ? (
          <span className="text-muted-foreground text-sm font-normal">
            (negotiable)
          </span>
        ) : null}
      </p>
      <p className="text-muted-foreground mb-4 text-sm">
        {category?.nameEn} · {location?.name} · {ad.condition}
      </p>

      <div className="flex flex-wrap gap-2">
        <FavoriteButton
          adId={ad.id}
          initialFavorited={favorited}
          isAuthenticated={viewerId !== null}
        />
        <MessageSellerButton
          adId={ad.id}
          isAuthenticated={viewerId !== null}
          isOwnAd={viewerId !== null && viewerId === ad.userId}
        />
        <ReportButton
          targetType="ad"
          targetId={ad.id}
          isAuthenticated={viewerId !== null}
        />
      </div>

      <div className="border-border my-4 border-t pt-4">
        <h2 className="mb-2 text-sm font-semibold">Description</h2>
        <p className="text-sm whitespace-pre-wrap">{ad.description}</p>
      </div>

      {attributes.length > 0 ? (
        <div className="border-border my-4 border-t pt-4">
          <h2 className="mb-2 text-sm font-semibold">Details</h2>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            {attributes.map((attr) => (
              <div key={attr.key}>
                <dt className="text-muted-foreground">{attr.label}</dt>
                <dd className="font-medium">{attr.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      ) : null}

      <div className="border-border my-4 border-t pt-4">
        <h2 className="mb-2 text-sm font-semibold">Seller</h2>
        <p className="text-sm">{seller?.displayName}</p>
        {sellerPhones.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {sellerPhones.map((phone) => (
              <a
                key={phone}
                href={`tel:${phone}`}
                className="border-border rounded-md border px-4 py-2.5 text-sm font-medium"
              >
                Call {phone}
              </a>
            ))}
            {sellerPhones.map((phone) => (
              <a
                key={`wa-${phone}`}
                href={`https://wa.me/${phone.replace("+", "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md border border-green-600 px-4 py-2.5 text-sm font-medium text-green-700"
              >
                WhatsApp
              </a>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground mt-2 text-sm">
            No verified phone number available.
          </p>
        )}
      </div>
    </div>
  );
}
