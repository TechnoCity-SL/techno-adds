import { NextResponse } from "next/server";
import {
  verifyNotifySignature,
  PAYHERE_STATUS,
  type NotifyPayload,
} from "@/lib/payments/payhere";
import {
  recordPayHereTransaction,
  markOrderPaid,
  markOrderFailed,
} from "@/lib/orders/order-status";

// No auth check and deliberately not rate-limited (CLAUDE.md rule #7 targets
// user-writable endpoints; this is a server-to-server webhook called by
// PayHere itself, not a user, and IP rate-limiting it risks dropping
// legitimate PayHere retries) — the signature check below is what protects
// this endpoint. CLAUDE.md rule #12: a payment is only ever marked paid here,
// server-side after signature verification, never from the client-side
// return_url redirect (see app/orders/[id]/return/page.tsx).
export async function POST(request: Request) {
  const formData = await request.formData();

  const payload: NotifyPayload = {
    merchant_id: String(formData.get("merchant_id") ?? ""),
    order_id: String(formData.get("order_id") ?? ""),
    payhere_amount: String(formData.get("payhere_amount") ?? ""),
    payhere_currency: String(formData.get("payhere_currency") ?? ""),
    status_code: String(formData.get("status_code") ?? ""),
    md5sig: String(formData.get("md5sig") ?? ""),
    payment_id: formData.get("payment_id")
      ? String(formData.get("payment_id"))
      : undefined,
  };

  if (!payload.order_id || !payload.md5sig) {
    return NextResponse.json(
      { error: "Malformed notify payload" },
      { status: 400 },
    );
  }

  if (!verifyNotifySignature(payload)) {
    console.error(
      "PayHere notify signature verification failed for order",
      payload.order_id,
    );
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const rawPayload = JSON.stringify(Object.fromEntries(formData.entries()));
  await recordPayHereTransaction(
    payload.order_id,
    payload.payment_id,
    payload.status_code,
    rawPayload,
  );

  if (payload.status_code === PAYHERE_STATUS.SUCCESS) {
    await markOrderPaid(payload.order_id);
  } else if (
    payload.status_code === PAYHERE_STATUS.CANCELED ||
    payload.status_code === PAYHERE_STATUS.FAILED ||
    payload.status_code === PAYHERE_STATUS.CHARGEDBACK
  ) {
    await markOrderFailed(payload.order_id);
  }

  return NextResponse.json({ received: true });
}
