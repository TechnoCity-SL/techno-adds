import { z } from "zod";

export const submitBankTransferProofSchema = z.object({
  cloudinaryPublicId: z.string().min(1),
});

export const rejectBankTransferSchema = z.object({
  reason: z.string().max(500).optional(),
});
