import "server-only";
import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db/postgres-client";

export class OrderNotOwnedError extends Error {}
export class OrderNotEligibleError extends Error {}

/**
 * Moves an order from pending -> awaiting_confirmation once the seller has
 * uploaded a transfer receipt (PLAN.md §10). Re-uploading (e.g. after a
 * moderator rejected a blurry receipt and the order was reset to pending)
 * is allowed — each call just adds another proof row, all visible to the
 * reviewing moderator.
 */
export async function submitBankTransferProof(
  userId: string,
  orderId: string,
  cloudinaryPublicId: string,
): Promise<void> {
  const [order] = await db
    .select()
    .from(schema.orders)
    .where(eq(schema.orders.id, orderId));
  if (!order || order.userId !== userId) {
    throw new OrderNotOwnedError(
      `Order not found or not owned by user: ${orderId}`,
    );
  }
  if (order.paymentMethod !== "bank_transfer" || order.status !== "pending") {
    throw new OrderNotEligibleError(
      `Order ${orderId} is not eligible for a bank-transfer proof upload`,
    );
  }

  await db.transaction(async (tx) => {
    await tx.insert(schema.bankTransferProofs).values({
      id: randomUUID(),
      orderId,
      cloudinaryPublicId,
    });
    await tx
      .update(schema.orders)
      .set({ status: "awaiting_confirmation" })
      .where(eq(schema.orders.id, orderId));
  });
}

export interface OrderWithBuyerContext {
  order: typeof schema.orders.$inferSelect;
  product: typeof schema.listingProducts.$inferSelect;
  ad: typeof schema.ads.$inferSelect;
}

export async function getBankTransferOrderForOwner(
  orderId: string,
  userId: string,
): Promise<OrderWithBuyerContext | null> {
  const [row] = await db
    .select({
      order: schema.orders,
      product: schema.listingProducts,
      ad: schema.ads,
    })
    .from(schema.orders)
    .innerJoin(
      schema.listingProducts,
      eq(schema.orders.listingProductId, schema.listingProducts.id),
    )
    .innerJoin(schema.ads, eq(schema.orders.adId, schema.ads.id))
    .where(
      and(
        eq(schema.orders.id, orderId),
        eq(schema.orders.userId, userId),
        eq(schema.orders.paymentMethod, "bank_transfer"),
      ),
    );
  return row ?? null;
}
