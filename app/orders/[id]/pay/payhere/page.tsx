import { notFound, redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { db, schema } from "@/lib/db/postgres-client";
import { getOrderForOwner } from "@/lib/orders/get-order";
import { createCheckout } from "@/lib/payments/payhere";
import { getSiteUrl } from "@/lib/site-url";

export default async function PayHereCheckoutPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) redirect(`/login?next=/orders/${id}/pay/payhere`);

  const detail = await getOrderForOwner(id, authData.user.id);
  if (
    !detail ||
    detail.order.paymentMethod !== "payhere" ||
    detail.order.status !== "pending"
  ) {
    notFound();
  }

  const [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, authData.user.id));
  const [location] = await db
    .select()
    .from(schema.locations)
    .where(eq(schema.locations.id, detail.ad.locationId));
  const [phoneRow] = await db
    .select({ phoneE164: schema.userPhoneNumbers.phoneE164 })
    .from(schema.userPhoneNumbers)
    .where(
      and(
        eq(schema.userPhoneNumbers.userId, authData.user.id),
        eq(schema.userPhoneNumbers.isVerified, true),
      ),
    );

  const displayName = user?.displayName ?? "TechnoAds User";
  const [firstName, ...rest] = displayName.split(" ");
  const lastName = rest.join(" ") || firstName;

  const siteUrl = getSiteUrl();
  const checkout = createCheckout({
    orderId: detail.order.id,
    amountLkr: detail.order.amountLkr,
    itemsDescription:
      `${detail.product.tier === "super" ? "Super" : "Top"} Ad boost (${detail.product.durationDays}d) - ${detail.ad.title}`.slice(
        0,
        100,
      ),
    returnUrl: `${siteUrl}/orders/${detail.order.id}/return`,
    cancelUrl: `${siteUrl}/my-ads/${detail.ad.id}/boost`,
    notifyUrl: `${siteUrl}/api/payments/payhere/notify`,
    buyer: {
      firstName,
      lastName,
      email: authData.user.email ?? "",
      phone: phoneRow?.phoneE164 ?? "",
      address: "N/A",
      city: location?.name ?? "Colombo",
    },
  });

  return (
    <div className="mx-auto max-w-md px-4 py-10 text-center">
      <h1 className="mb-2 text-lg font-semibold">Ready to pay with PayHere</h1>
      <p className="text-muted-foreground mb-6 text-sm">
        Rs. {detail.order.amountLkr.toLocaleString()} for{" "}
        {detail.product.tier === "super" ? "Super Ad" : "Top Ad"} (
        {detail.product.durationDays} days)
      </p>
      <form method="post" action={checkout.action}>
        {Object.entries(checkout.fields).map(([key, value]) => (
          <input key={key} type="hidden" name={key} value={value} />
        ))}
        <button
          type="submit"
          className="bg-primary text-primary-foreground w-full rounded-md px-4 py-2.5 text-sm font-medium"
        >
          Proceed to PayHere
        </button>
      </form>
    </div>
  );
}
