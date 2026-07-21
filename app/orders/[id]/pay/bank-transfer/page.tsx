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
  const tierLabel = product.tier === "super" ? "Super Ad" : "Top Ad";

  return (
    <div className="pb-16">
      <main className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold">Complete Payment</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Transfer the exact amount to the bank details below to activate your{" "}
            {tierLabel} listing.
          </p>
        </div>

        <div className="bg-card border-border mb-4 rounded-xl border p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="bg-accent text-primary inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold tracking-wider uppercase">
                {tierLabel} Tier
              </span>
              <h2 className="mt-2 text-lg font-bold">{ad.title}</h2>
              <p className="text-muted-foreground text-xs">
                Validity: {product.durationDays} Days
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-muted-foreground text-xs uppercase">
                Total Amount
              </p>
              <p className="text-primary text-xl font-bold">
                Rs. {order.amountLkr.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {order.status === "paid" ? (
          <div className="bg-accent text-primary flex items-center gap-3 rounded-xl p-5 text-sm font-semibold">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="shrink-0"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <path d="m22 4-10 10-3-3" />
            </svg>
            Payment confirmed — your ad&apos;s boost is now active.
          </div>
        ) : order.status === "awaiting_confirmation" ? (
          <div className="bg-muted flex items-center gap-3 rounded-xl p-5 text-sm">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-primary shrink-0"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
            Receipt submitted. A moderator will review it shortly — you&apos;ll
            see the boost activate on My Ads once approved.
          </div>
        ) : order.status === "failed" ? (
          <div className="bg-destructive/10 text-destructive flex items-center gap-3 rounded-xl p-5 text-sm">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="shrink-0"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
            This payment couldn&apos;t be confirmed. Please start a new boost
            order from My Ads.
          </div>
        ) : (
          <>
            <div className="bg-card border-border mb-4 overflow-hidden rounded-xl border shadow-sm">
              <div className="bg-primary text-primary-foreground flex items-center gap-2 px-5 py-3">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 21h18M4 10h16M12 3 3 8h18ZM6 10v8M10 10v8M14 10v8M18 10v8" />
                </svg>
                <span className="text-sm font-semibold">
                  Bank Transfer Details
                </span>
              </div>
              <div className="flex flex-col gap-4 p-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-muted-foreground text-xs uppercase">
                      Bank Name
                    </p>
                    <p className="text-sm font-semibold">
                      {bankDetails.bankName}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs uppercase">
                      Branch
                    </p>
                    <p className="text-sm font-semibold">
                      {bankDetails.branch}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground text-xs uppercase">
                      Account Name
                    </p>
                    <p className="text-sm font-semibold">
                      {bankDetails.accountName}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase">
                    Account Number
                  </p>
                  <div className="bg-muted border-border mt-1 flex items-center justify-between rounded-lg border p-3">
                    <code className="text-primary text-lg font-bold">
                      {bankDetails.accountNumber}
                    </code>
                  </div>
                </div>
                <div className="bg-accent border-primary/30 flex items-center justify-between rounded-xl border-2 border-dashed p-4">
                  <div>
                    <p className="text-primary text-xs font-bold uppercase">
                      Payment Reference
                    </p>
                    <p className="text-base font-bold tracking-widest uppercase">
                      {order.id.slice(0, 8)}
                    </p>
                  </div>
                </div>
                <p className="text-muted-foreground text-xs italic">
                  Please include this reference code in your transfer
                  description to avoid delays.
                </p>
              </div>
            </div>

            <div className="mb-4">
              <h3 className="mb-2 text-xs font-semibold tracking-wider uppercase">
                Proof of Payment
              </h3>
              <BankTransferUpload orderId={order.id} />
            </div>

            <div className="bg-muted flex items-start gap-3 rounded-xl p-4">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-primary mt-0.5 shrink-0"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4M12 8h.01" />
              </svg>
              <div>
                <p className="text-sm font-semibold">Moderator Verification</p>
                <p className="text-muted-foreground mt-1 text-xs">
                  Once uploaded, our moderators will review your transfer.
                  You&apos;ll see the boost activate on My Ads once approved.
                </p>
              </div>
            </div>
          </>
        )}

        <Link
          href="/my-ads"
          className="text-primary mt-6 block text-center text-sm font-semibold"
        >
          Back to My Ads
        </Link>
      </main>
    </div>
  );
}
