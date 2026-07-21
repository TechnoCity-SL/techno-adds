"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Product {
  id: string;
  code: string;
  tier: string;
  durationDays: number;
  priceLkr: number;
}

const TIER_META: Record<
  string,
  { label: string; description: string; iconClassName: string }
> = {
  top: {
    label: "Top Ad",
    description:
      "Your ad stays at the top of search results for the chosen duration.",
    iconClassName: "text-tier-top",
  },
  super: {
    label: "Super Ad",
    description:
      "Highlight your ad with a distinctive badge and premium placement.",
    iconClassName: "text-tier-super",
  },
};

export function BoostForm({
  adId,
  products,
}: {
  adId: string;
  products: Product[];
}) {
  const router = useRouter();
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [paymentMethod, setPaymentMethod] = useState<
    "payhere" | "bank_transfer"
  >("payhere");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedProduct = products.find((p) => p.id === productId);
  const tiers = Array.from(new Set(products.map((p) => p.tier)));

  async function submit() {
    if (!productId) return;
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adId,
          listingProductId: productId,
          paymentMethod,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(
          typeof data.error === "string"
            ? data.error
            : "Failed to create order.",
        );
        return;
      }
      router.push(
        paymentMethod === "payhere"
          ? `/orders/${data.id}/pay/payhere`
          : `/orders/${data.id}/pay/bank-transfer`,
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      {tiers.map((tier) => {
        const meta = TIER_META[tier] ?? {
          label: tier,
          description: "",
          iconClassName: "text-primary",
        };
        return (
          <section key={tier}>
            <div className="mb-3 flex items-center gap-2">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="currentColor"
                className={meta.iconClassName}
              >
                <path d="M12 2 4 5v6c0 5 3.5 8.5 8 11 4.5-2.5 8-6 8-11V5l-8-3Z" />
              </svg>
              <h2 className="text-lg font-bold">{meta.label}</h2>
            </div>
            <p className="text-muted-foreground mb-3 text-sm">
              {meta.description}
            </p>
            <div className="flex flex-col gap-2">
              {products
                .filter((p) => p.tier === tier)
                .map((p) => (
                  <label
                    key={p.id}
                    className={`bg-card flex cursor-pointer items-center justify-between rounded-xl border-2 p-4 transition-all active:scale-[0.98] ${
                      productId === p.id
                        ? "border-primary bg-accent"
                        : "border-border"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="product"
                        value={p.id}
                        checked={productId === p.id}
                        onChange={() => setProductId(p.id)}
                        className="text-primary h-5 w-5"
                      />
                      <span>
                        <span className="block text-sm font-semibold">
                          {p.durationDays} Days Promotion
                        </span>
                      </span>
                    </span>
                    <span className="text-primary font-bold">
                      Rs. {p.priceLkr.toLocaleString()}
                    </span>
                  </label>
                ))}
            </div>
          </section>
        );
      })}

      <section>
        <h2 className="mb-3 text-lg font-bold">Payment Method</h2>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setPaymentMethod("payhere")}
            className={`bg-card flex flex-col items-start gap-2 rounded-xl border-2 p-4 text-left transition-all ${
              paymentMethod === "payhere"
                ? "border-primary bg-accent"
                : "border-border"
            }`}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-primary"
            >
              <rect x="1" y="4" width="22" height="16" rx="2" />
              <path d="M1 10h22" />
            </svg>
            <span>
              <span className="block text-sm font-semibold">Card / Wallet</span>
              <span className="text-muted-foreground block text-xs">
                PayHere Secure
              </span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => setPaymentMethod("bank_transfer")}
            className={`bg-card flex flex-col items-start gap-2 rounded-xl border-2 p-4 text-left transition-all ${
              paymentMethod === "bank_transfer"
                ? "border-primary bg-accent"
                : "border-border"
            }`}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-muted-foreground"
            >
              <path d="M3 21h18M4 10h16M12 3 3 8h18ZM6 10v8M10 10v8M14 10v8M18 10v8" />
            </svg>
            <span>
              <span className="block text-sm font-semibold">Bank Transfer</span>
              <span className="text-muted-foreground block text-xs">
                Manual Verification
              </span>
            </span>
          </button>
        </div>
      </section>

      {error ? <p className="text-destructive text-sm">{error}</p> : null}

      <div className="border-border bg-card fixed right-0 bottom-0 left-0 border-t px-4 py-3">
        <div className="mx-auto flex max-w-xl flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-sm">Total Amount:</span>
            <span className="text-primary text-lg font-bold">
              Rs. {(selectedProduct?.priceLkr ?? 0).toLocaleString()}
            </span>
          </div>
          <button
            type="button"
            onClick={submit}
            disabled={pending || !productId}
            className="bg-primary text-primary-foreground flex h-14 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold shadow-md transition-transform active:scale-95 disabled:opacity-50"
          >
            {pending ? "Creating order..." : "Continue to Payment"}
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
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
