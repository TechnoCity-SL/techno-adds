import "server-only";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db/postgres-client";

export async function recordPayHereTransaction(
  orderId: string,
  providerPaymentId: string | undefined,
  statusCode: string,
  rawPayload: string,
): Promise<void> {
  await db.insert(schema.paymentTransactions).values({
    id: randomUUID(),
    orderId,
    provider: "payhere",
    providerPaymentId: providerPaymentId ?? null,
    statusCode,
    rawPayload,
  });
}

/**
 * Marks an order paid and activates the ad's tier. Idempotent (a no-op if
 * the order is already paid) so a duplicate PayHere IPN retry, or an
 * over-eager moderator double-click on the bank-transfer approval button,
 * can't double-extend an ad's boost. Payment-method-agnostic: called from
 * both the PayHere notify webhook and the bank-transfer admin review action.
 *
 * If the ad already has time left on its current tier, the new duration is
 * added on top rather than reset from now — a seller extending an existing
 * boost shouldn't lose the days they already paid for. Known simplification,
 * not yet handled: buying a different tier than the one currently active
 * just overwrites listingTier with the new purchase's tier (no "upgrade
 * only, never downgrade" resolution logic).
 */
export async function markOrderPaid(orderId: string): Promise<void> {
  await db.transaction(async (tx) => {
    const [order] = await tx
      .select()
      .from(schema.orders)
      .where(eq(schema.orders.id, orderId));
    if (!order || order.status === "paid") return;

    await tx
      .update(schema.orders)
      .set({ status: "paid", paidAt: new Date() })
      .where(eq(schema.orders.id, orderId));

    const [product] = await tx
      .select()
      .from(schema.listingProducts)
      .where(eq(schema.listingProducts.id, order.listingProductId));
    const [ad] = await tx
      .select()
      .from(schema.ads)
      .where(eq(schema.ads.id, order.adId));
    if (!product || !ad) return;

    const base =
      ad.tierExpiresAt && ad.tierExpiresAt > new Date()
        ? ad.tierExpiresAt
        : new Date();
    const newExpiry = new Date(
      base.getTime() + product.durationDays * 24 * 60 * 60 * 1000,
    );

    await tx
      .update(schema.ads)
      .set({ listingTier: product.tier, tierExpiresAt: newExpiry })
      .where(eq(schema.ads.id, ad.id));
  });
}

export async function markOrderFailed(orderId: string): Promise<void> {
  await db
    .update(schema.orders)
    .set({ status: "failed" })
    .where(eq(schema.orders.id, orderId));
}
