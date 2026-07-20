import "server-only";
import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db/postgres-client";

export class AdNotOwnedError extends Error {}
export class AdNotActiveError extends Error {}
export class InvalidListingProductError extends Error {}

export type PaymentMethod = "payhere" | "bank_transfer";

/**
 * Only an ad's own owner can boost it, and only while it's active — mirrors
 * the same ownership check style as every other mutation in this codebase
 * (CLAUDE.md rule #4: our Postgres client bypasses RLS, so this check is the
 * real enforcement, not a redundant one).
 */
export async function createOrder(
  userId: string,
  adId: string,
  listingProductId: string,
  paymentMethod: PaymentMethod,
): Promise<{ orderId: string; amountLkr: number }> {
  const [ad] = await db
    .select()
    .from(schema.ads)
    .where(eq(schema.ads.id, adId));
  if (!ad || ad.userId !== userId) {
    throw new AdNotOwnedError(`Ad not found or not owned by user: ${adId}`);
  }
  if (ad.status !== "active") {
    throw new AdNotActiveError(`Ad is not active: ${adId}`);
  }

  const [product] = await db
    .select()
    .from(schema.listingProducts)
    .where(
      and(
        eq(schema.listingProducts.id, listingProductId),
        eq(schema.listingProducts.isActive, true),
      ),
    );
  if (!product) {
    throw new InvalidListingProductError(
      `Unknown or inactive listing product: ${listingProductId}`,
    );
  }

  const orderId = randomUUID();
  // amountLkr snapshots the price paid now — the rate card can change later
  // and this order must keep the amount actually charged.
  await db.insert(schema.orders).values({
    id: orderId,
    userId,
    adId,
    listingProductId,
    amountLkr: product.priceLkr,
    paymentMethod,
    status: "pending",
  });

  return { orderId, amountLkr: product.priceLkr };
}
