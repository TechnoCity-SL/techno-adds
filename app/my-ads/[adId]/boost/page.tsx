import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { getOwnAd } from "@/lib/ads/get-own-ad";
import { listActiveListingProducts } from "@/lib/orders/listing-products";
import { buildImageUrl } from "@/lib/cloudinary/url";
import { BackButton } from "@/components/molecules/BackButton";
import { BoostForm } from "@/components/organisms/BoostForm";

export default async function BoostAdPage({
  params,
}: {
  params: Promise<{ adId: string }>;
}) {
  const { adId } = await params;
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) redirect(`/login?next=/my-ads/${adId}/boost`);

  const ad = await getOwnAd(authData.user.id, adId);
  if (!ad || ad.status !== "active") notFound();

  const products = await listActiveListingProducts();
  const thumbnailUrl = ad.thumbnailPublicId
    ? buildImageUrl(ad.thumbnailPublicId, "w_160,h_160,c_fill,f_auto,q_auto")
    : null;

  return (
    <div className="pb-32">
      <header className="bg-card sticky top-0 z-20 shadow-sm">
        <div className="mx-auto flex max-w-xl items-center gap-1 px-2 py-1">
          <BackButton />
          <h1 className="text-primary text-lg font-bold">Boost Ad</h1>
        </div>
      </header>

      <main className="mx-auto max-w-xl px-4 py-6">
        <div className="bg-card border-border mb-6 flex items-center gap-4 rounded-xl border p-4 shadow-sm">
          <div className="bg-muted relative h-20 w-20 shrink-0 overflow-hidden rounded-lg">
            {thumbnailUrl ? (
              <Image
                src={thumbnailUrl}
                alt={ad.title}
                fill
                sizes="80px"
                className="object-cover"
              />
            ) : null}
          </div>
          <div className="min-w-0">
            <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
              Promoting your ad
            </p>
            <h2 className="truncate text-base font-bold">{ad.title}</h2>
            <p className="text-primary text-lg font-bold">
              Rs. {ad.price.toLocaleString()}
            </p>
          </div>
        </div>

        <BoostForm
          adId={ad.id}
          products={products.map((p) => ({
            id: p.id,
            code: p.code,
            tier: p.tier,
            durationDays: p.durationDays,
            priceLkr: p.priceLkr,
          }))}
        />
      </main>
    </div>
  );
}
