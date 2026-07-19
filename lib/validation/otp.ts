import { z } from "zod";
import { phoneInputSchema } from "./phone";

export const otpSendRequestSchema = z.object({
  phone: phoneInputSchema,
});

export const otpVerifyRequestSchema = z.object({
  phone: phoneInputSchema,
  code: z.string().regex(/^\d{6}$/, "code must be 6 digits"),
});
