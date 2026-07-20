import { z } from "zod";

export const createReportSchema = z.object({
  targetType: z.enum(["ad", "user"]),
  targetId: z.string().min(1),
  reason: z.string().min(5).max(500),
});
