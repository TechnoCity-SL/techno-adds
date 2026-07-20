import "server-only";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db/postgres-client";
import { logModerationAction } from "./moderation";
import { markOrderPaid } from "@/lib/orders/order-status";

export class OrderNotAwaitingConfirmationError extends Error {}

export interface AwaitingConfirmationRow {
  order: typeof schema.orders.$inferSelect;
  product: typeof schema.listingProducts.$inferSelect;
  ad: typeof schema.ads.$inferSelect;
  proof: typeof schema.bankTransferProofs.$inferSelect;
}

export async function listAwaitingConfirmationOrders(): Promise<
  AwaitingConfirmationRow[]
> {
  return db
    .select({
      order: schema.orders,
      product: schema.listingProducts,
      ad: schema.ads,
      proof: schema.bankTransferProofs,
    })
    .from(schema.orders)
    .innerJoin(
      schema.listingProducts,
      eq(schema.orders.listingProductId, schema.listingProducts.id),
    )
    .innerJoin(schema.ads, eq(schema.orders.adId, schema.ads.id))
    .innerJoin(
      schema.bankTransferProofs,
      eq(schema.bankTransferProofs.orderId, schema.orders.id),
    )
    .where(eq(schema.orders.status, "awaiting_confirmation"))
    .orderBy(desc(schema.orders.createdAt));
}

async function requireAwaitingConfirmation(orderId: string) {
  const [order] = await db
    .select()
    .from(schema.orders)
    .where(eq(schema.orders.id, orderId));
  if (!order || order.status !== "awaiting_confirmation") {
    throw new OrderNotAwaitingConfirmationError(
      `Order ${orderId} is not awaiting confirmation`,
    );
  }
  return order;
}

export async function approveBankTransfer(
  moderatorId: string,
  orderId: string,
): Promise<void> {
  await requireAwaitingConfirmation(orderId);

  await markOrderPaid(orderId);
  await db
    .update(schema.bankTransferProofs)
    .set({ reviewedByModeratorId: moderatorId, reviewedAt: new Date() })
    .where(eq(schema.bankTransferProofs.orderId, orderId));
  await logModerationAction(
    moderatorId,
    "order",
    orderId,
    "approve_bank_transfer",
  );
}

export async function rejectBankTransfer(
  moderatorId: string,
  orderId: string,
  reason?: string,
): Promise<void> {
  await requireAwaitingConfirmation(orderId);

  await db
    .update(schema.orders)
    .set({ status: "failed" })
    .where(eq(schema.orders.id, orderId));
  await db
    .update(schema.bankTransferProofs)
    .set({ reviewedByModeratorId: moderatorId, reviewedAt: new Date() })
    .where(eq(schema.bankTransferProofs.orderId, orderId));
  await logModerationAction(
    moderatorId,
    "order",
    orderId,
    "reject_bank_transfer",
    reason,
  );
}
