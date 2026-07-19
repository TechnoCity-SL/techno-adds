import { z } from "zod";

export const createAdSchema = z.object({
  categoryId: z.string().min(1),
  locationId: z.string().min(1),
  title: z.string().min(5).max(120),
  description: z.string().min(20).max(5000),
  price: z.number().positive(),
  isNegotiable: z.boolean().default(false),
  condition: z.enum(["new", "used"]),
  attributes: z.record(z.string(), z.string()).default({}),
  // Cloudinary public_ids, already uploaded client-side via /api/cloudinary/sign
  // before this request — cap of 5 matches PLAN.md §3 MVP scope ("up to 5 photos").
  images: z.array(z.string().min(1)).max(5).default([]),
});
