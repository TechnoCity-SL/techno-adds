import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getOwnAd } from "@/lib/ads/get-own-ad";
import { listActiveListingProducts } from "@/lib/orders/listing-products";
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

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="mb-1 text-xl font-semibold">Boost: {ad.title}</h1>
      <p className="text-muted-foreground mb-4 text-sm">
        Choose a placement to boost your ad&apos;s visibility.
      </p>
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
    </div>
  );
}
