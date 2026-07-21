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
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div
          className={`mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full ${
            isPaid ? "bg-accent text-primary" : "bg-muted text-muted-foreground"
          }`}
        >
          {isPaid ? (
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <path d="m22 4-10 10-3-3" />
            </svg>
          ) : (
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="animate-spin"
            >
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          )}
        </div>
        <h1 className="text-xl font-bold">
          {isPaid ? "Payment confirmed!" : "Payment received, confirming…"}
        </h1>
        <p className="text-muted-foreground mt-2 mb-8 text-sm">
          {isPaid
            ? "Your ad's boost is now active."
            : "We're waiting for PayHere to confirm this payment — this can take a few seconds. Check My Ads shortly if this doesn't update."}
        </p>
        <Link
          href="/my-ads"
          className="bg-primary text-primary-foreground inline-flex h-14 items-center justify-center rounded-xl px-8 text-sm font-bold shadow-md transition-transform active:scale-95"
        >
          Back to My Ads
        </Link>
      </div>
    </div>
  );
}
