import { z } from "zod";

export const moderationReasonSchema = z.object({
  reason: z.string().max(500).optional(),
});
