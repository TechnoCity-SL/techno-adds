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
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h2 className="mb-4 text-xl font-semibold">Bank Transfer Payments</h2>
      {error ? <p className="text-destructive mb-4 text-sm">{error}</p> : null}

      {orders.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No payments awaiting confirmation.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {orders.map((o) => (
            <li
              key={o.id}
              className="border-border flex flex-col gap-3 rounded-md border p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="bg-muted relative h-16 w-16 shrink-0 overflow-hidden rounded-md">
                  <Image
                    src={o.receiptUrl}
                    alt="Transfer receipt"
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </div>
                <div>
                  <p className="font-medium">{o.adTitle}</p>
                  <p className="text-muted-foreground text-sm">
                    {o.tier === "super" ? "Super Ad" : "Top Ad"} (
                    {o.durationDays}d) · Rs. {o.amountLkr.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={pendingId === o.id}
                  onClick={() => act(o.id, "approve")}
                  className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50"
                >
                  Approve
                </button>
                <button
                  type="button"
                  disabled={pendingId === o.id}
                  onClick={() => act(o.id, "reject")}
                  className="border-destructive text-destructive rounded-md border px-4 py-2 text-sm font-medium disabled:opacity-50"
                >
                  Reject
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
