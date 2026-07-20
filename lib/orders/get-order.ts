import "server-only";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db/postgres-client";

export interface OrderDetail {
  order: typeof schema.orders.$inferSelect;
  product: typeof schema.listingProducts.$inferSelect;
  ad: typeof schema.ads.$inferSelect;
}

export async function getOrderForOwner(
  orderId: string,
  userId: string,
): Promise<OrderDetail | null> {
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
      and(eq(schema.orders.id, orderId), eq(schema.orders.userId, userId)),
    );
  return row ?? null;
}
