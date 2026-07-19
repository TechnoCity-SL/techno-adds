import { z } from "zod";

export const uploadSignRequestSchema = z.object({
  folder: z
    .string()
    .min(1)
    .max(100)
    .regex(
      /^[a-zA-Z0-9/_-]+$/,
      "folder may only contain letters, numbers, /, _, -",
    )
    .default("uploads"),
});

export type UploadSignRequest = z.infer<typeof uploadSignRequestSchema>;
