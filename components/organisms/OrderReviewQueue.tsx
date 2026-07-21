"use client";

import { useState } from "react";
import Image from "next/image";

interface PendingOrder {
  id: string;
  adTitle: string;
  amountLkr: number;
  tier: string;
  durationDays: number;
  receiptUrl: string;
}

export function OrderReviewQueue({
  initialOrders,
}: {
  initialOrders: PendingOrder[];
}) {
  const [orders, setOrders] = useState(initialOrders);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function act(orderId: string, action: "approve" | "reject") {
    setPendingId(orderId);
    setError(null);
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(
          typeof data.error === "string" ? data.error : `Failed to ${action}`,
        );
        return;
      }
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
    } finally {
      setPendingId(null);
    }
  }

  return (
    <section className="bg-card border-border overflow-hidden rounded-2xl border shadow-sm">
      <div className="border-border bg-muted/30 border-b px-5 py-4">
        <h2 className="text-base font-bold">Bank Transfer Payments</h2>
      </div>

      {error ? (
        <p className="text-destructive px-5 pt-4 text-sm">{error}</p>
      ) : null}

      {orders.length === 0 ? (
        <p className="text-muted-foreground p-5 text-sm">
          No payments awaiting confirmation.
        </p>
      ) : (
        <div className="flex flex-col gap-3 p-4">
          {orders.map((o) => (
            <div
              key={o.id}
              className="border-border flex flex-col gap-3 rounded-xl border p-3"
            >
              <div className="flex items-center gap-3">
                <div className="bg-muted relative h-16 w-16 shrink-0 overflow-hidden rounded-lg">
                  <Image
                    src={o.receiptUrl}
                    alt="Transfer receipt"
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">{o.adTitle}</p>
                  <p className="text-muted-foreground text-xs">
                    {o.tier === "super" ? "Super Ad" : "Top Ad"} (
                    {o.durationDays}d)
                  </p>
                  <p className="text-primary text-sm font-semibold">
                    Rs. {o.amountLkr.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={pendingId === o.id}
                  onClick={() => act(o.id, "approve")}
                  className="bg-primary text-primary-foreground flex-1 rounded-lg py-2 text-xs font-bold disabled:opacity-50"
                >
                  Approve
                </button>
                <button
                  type="button"
                  disabled={pendingId === o.id}
                  onClick={() => act(o.id, "reject")}
                  className="border-destructive text-destructive flex-1 rounded-lg border py-2 text-xs font-bold disabled:opacity-50"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
