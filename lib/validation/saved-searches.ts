import { z } from "zod";

export const saveSearchSchema = z.object({
  q: z.string().min(1).max(200),
});
