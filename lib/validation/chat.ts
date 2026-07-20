import { z } from "zod";

export const startConversationSchema = z.object({
  adId: z.string().min(1),
});

export const sendMessageSchema = z.object({
  content: z.string().min(1).max(2000),
});
