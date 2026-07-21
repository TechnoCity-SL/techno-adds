import { z } from "zod";

// Category/search listing page filters — parsed from the URL search params
// (a raw <form method="get"> submit, no client JS required), so every field
// is optional and coerced from strings. `condition` arrives as either a
// single string or a string[] depending on how many checkboxes were ticked,
// since Next.js only arrays a repeated query key.
export const listingFiltersSchema = z.object({
  minPrice: z.coerce.number().positive().optional().catch(undefined),
  maxPrice: z.coerce.number().positive().optional().catch(undefined),
  condition: z
    .union([z.enum(["new", "used"]), z.array(z.enum(["new", "used"]))])
    .optional()
    .catch(undefined)
    .transform((v) => (v === undefined ? [] : Array.isArray(v) ? v : [v])),
});

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
