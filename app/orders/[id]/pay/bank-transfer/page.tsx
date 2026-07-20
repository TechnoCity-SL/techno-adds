import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getBankTransferOrderForOwner } from "@/lib/orders/bank-transfer";
import { getBankTransferDetails } from "@/lib/payments/bank-details";
import { BankTransferUpload } from "@/components/organisms/BankTransferUpload";

export default async function BankTransferPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) redirect(`/login?next=/orders/${id}/pay/bank-transfer`);

  const detail = await getBankTransferOrderForOwner(id, authData.user.id);
  if (!detail) notFound();

  const { order, product, ad } = detail;
  const bankDetails = getBankTransferDetails();

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <h1 className="mb-1 text-lg font-semibold">Bank Transfer</h1>
      <p className="text-muted-foreground mb-6 text-sm">
        Rs. {order.amountLkr.toLocaleString()} for{" "}
        {product.tier === "super" ? "Super Ad" : "Top Ad"} (
        {product.durationDays} days) on &ldquo;{ad.title}&rdquo;
      </p>

      {order.status === "paid" ? (
        <div className="rounded-md border border-green-600 p-4 text-sm text-green-700">
          Payment confirmed — your ad&apos;s boost is now active.
        </div>
      ) : order.status === "awaiting_confirmation" ? (
        <div className="border-border rounded-md border p-4 text-sm">
          Receipt submitted. A moderator will review it shortly — you&apos;ll
          see the boost activate on My Ads once approved.
        </div>
      ) : order.status === "failed" ? (
        <div className="text-destructive border-destructive rounded-md border p-4 text-sm">
          This payment couldn&apos;t be confirmed. Please start a new boost
          order from My Ads.
        </div>
      ) : (
        <>
          <div className="border-border mb-4 rounded-md border p-4 text-sm">
            <p className="mb-2 font-medium">Transfer to:</p>
            <dl className="space-y-1">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Bank</dt>
                <dd>{bankDetails.bankName}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Account name</dt>
                <dd>{bankDetails.accountName}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Account number</dt>
                <dd>{bankDetails.accountNumber}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Branch</dt>
                <dd>{bankDetails.branch}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Reference</dt>
                <dd className="font-mono">{order.id.slice(0, 8)}</dd>
              </div>
            </dl>
          </div>
          <BankTransferUpload orderId={order.id} />
        </>
      )}

      <Link
        href="/my-ads"
        className="text-primary mt-6 block text-center text-sm"
      >
        Back to My Ads
      </Link>
    </div>
  );
}
