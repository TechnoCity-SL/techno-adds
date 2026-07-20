import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getOrderForOwner } from "@/lib/orders/get-order";

// Informational only, per CLAUDE.md rule #12 — landing here after PayHere's
// client-side redirect never itself marks anything paid. The actual status
// shown is whatever the DB already says, which only the server-verified
// notify webhook (app/api/payments/payhere/notify/route.ts) can change.
export default async function OrderReturnPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) redirect(`/login?next=/orders/${id}/return`);

  const detail = await getOrderForOwner(id, authData.user.id);
  if (!detail) notFound();

  const isPaid = detail.order.status === "paid";

  return (
    <div className="mx-auto max-w-md px-4 py-10 text-center">
      <h1 className="mb-2 text-lg font-semibold">
        {isPaid ? "Payment confirmed!" : "Payment received, confirming…"}
      </h1>
      <p className="text-muted-foreground mb-6 text-sm">
        {isPaid
          ? "Your ad's boost is now active."
          : "We're waiting for PayHere to confirm this payment — this can take a few seconds. Check My Ads shortly if this doesn't update."}
      </p>
      <Link href="/my-ads" className="text-primary text-sm font-medium">
        Back to My Ads
      </Link>
    </div>
  );
}
