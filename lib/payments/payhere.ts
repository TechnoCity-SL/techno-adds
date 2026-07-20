import "server-only";
import { createHash } from "node:crypto";

// PayHere status_code values from their IPN payload (integration guide).
export const PAYHERE_STATUS = {
  SUCCESS: "2",
  PENDING: "0",
  CANCELED: "-1",
  FAILED: "-2",
  CHARGEDBACK: "-3",
} as const;

interface PayHereConfig {
  merchantId: string;
  merchantSecret: string;
  checkoutUrl: string;
}

function getConfig(): PayHereConfig {
  const { PAYHERE_MERCHANT_ID, PAYHERE_MERCHANT_SECRET, PAYHERE_MODE } =
    process.env;
  if (!PAYHERE_MERCHANT_ID || !PAYHERE_MERCHANT_SECRET) {
    throw new Error(
      "PayHere is not configured — set PAYHERE_MERCHANT_ID, PAYHERE_MERCHANT_SECRET",
    );
  }
  // Defaults to sandbox unless explicitly "live" — a missing/misconfigured
  // PAYHERE_MODE should never accidentally point at real PayHere.
  const mode = PAYHERE_MODE === "live" ? "live" : "sandbox";
  return {
    merchantId: PAYHERE_MERCHANT_ID,
    merchantSecret: PAYHERE_MERCHANT_SECRET,
    checkoutUrl:
      mode === "live"
        ? "https://www.payhere.lk/pay/checkout"
        : "https://sandbox.payhere.lk/pay/checkout",
  };
}

function md5(input: string): string {
  return createHash("md5").update(input).digest("hex").toUpperCase();
}

export interface CheckoutOrder {
  orderId: string;
  amountLkr: number;
  itemsDescription: string;
  returnUrl: string;
  cancelUrl: string;
  notifyUrl: string;
  buyer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
  };
}

export interface CheckoutPayload {
  action: string;
  fields: Record<string, string>;
}

/**
 * Builds the hidden-form field set for PayHere's hosted checkout, per their
 * integration guide's hash formula. The caller renders this as an
 * auto-submitting <form method="post"> pointing at `action` — PayHere has no
 * JS-callable API for this, only a classic form POST redirect.
 */
export function createCheckout(order: CheckoutOrder): CheckoutPayload {
  const config = getConfig();
  const amount = order.amountLkr.toFixed(2);
  const currency = "LKR";

  const hash = md5(
    config.merchantId +
      order.orderId +
      amount +
      currency +
      md5(config.merchantSecret),
  );

  return {
    action: config.checkoutUrl,
    fields: {
      merchant_id: config.merchantId,
      return_url: order.returnUrl,
      cancel_url: order.cancelUrl,
      notify_url: order.notifyUrl,
      order_id: order.orderId,
      items: order.itemsDescription,
      currency,
      amount,
      first_name: order.buyer.firstName,
      last_name: order.buyer.lastName,
      email: order.buyer.email,
      phone: order.buyer.phone,
      address: order.buyer.address,
      city: order.buyer.city,
      country: "Sri Lanka",
      hash,
    },
  };
}

export interface NotifyPayload {
  merchant_id: string;
  order_id: string;
  payhere_amount: string;
  payhere_currency: string;
  status_code: string;
  md5sig: string;
  payment_id?: string;
}

/**
 * Verifies PayHere's server-to-server IPN signature (CLAUDE.md rule #12 —
 * every payment state transition is server-verified, never client-trusted).
 * The client-side return_url redirect is informational only; this signature
 * check is the only thing allowed to actually mark an order paid.
 */
export function verifyNotifySignature(payload: NotifyPayload): boolean {
  const config = getConfig();
  if (payload.merchant_id !== config.merchantId) return false;

  const expected = md5(
    payload.merchant_id +
      payload.order_id +
      payload.payhere_amount +
      payload.payhere_currency +
      payload.status_code +
      md5(config.merchantSecret),
  );
  return expected === payload.md5sig.toUpperCase();
}
