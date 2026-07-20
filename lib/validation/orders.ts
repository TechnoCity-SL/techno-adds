import { z } from "zod";

export const createOrderSchema = z.object({
  adId: z.string().min(1),
  listingProductId: z.string().min(1),
  paymentMethod: z.enum(["payhere", "bank_transfer"]),
});
