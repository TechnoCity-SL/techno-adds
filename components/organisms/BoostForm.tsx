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
    <div className="flex flex-col gap-4">
      <div>
        <p className="mb-2 text-sm font-medium">Placement</p>
        <div className="flex flex-col gap-2">
          {products.map((p) => (
            <label
              key={p.id}
              className={`border-border flex cursor-pointer items-center justify-between rounded-md border px-3 py-2.5 text-sm ${
                productId === p.id ? "border-primary" : ""
              }`}
            >
              <span className="flex items-center gap-2">
                <input
                  type="radio"
                  name="product"
                  value={p.id}
                  checked={productId === p.id}
                  onChange={() => setProductId(p.id)}
                />
                {p.tier === "super" ? "Super Ad" : "Top Ad"} — {p.durationDays}{" "}
                days
              </span>
              <span className="font-medium">
                Rs. {p.priceLkr.toLocaleString()}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">Payment method</p>
        <div className="flex gap-2">
          <label
            className={`border-border flex-1 cursor-pointer rounded-md border px-3 py-2.5 text-center text-sm ${
              paymentMethod === "payhere" ? "border-primary" : ""
            }`}
          >
            <input
              type="radio"
              name="method"
              className="sr-only"
              value="payhere"
              checked={paymentMethod === "payhere"}
              onChange={() => setPaymentMethod("payhere")}
            />
            Card / Wallet (PayHere)
          </label>
          <label
            className={`border-border flex-1 cursor-pointer rounded-md border px-3 py-2.5 text-center text-sm ${
              paymentMethod === "bank_transfer" ? "border-primary" : ""
            }`}
          >
            <input
              type="radio"
              name="method"
              className="sr-only"
              value="bank_transfer"
              checked={paymentMethod === "bank_transfer"}
              onChange={() => setPaymentMethod("bank_transfer")}
            />
            Bank Transfer
          </label>
        </div>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <button
        type="button"
        onClick={submit}
        disabled={pending || !productId}
        className="bg-primary text-primary-foreground rounded-md px-4 py-2.5 text-sm font-medium disabled:opacity-50"
      >
        {pending ? "Creating order..." : "Continue to payment"}
      </button>
    </div>
  );
}
