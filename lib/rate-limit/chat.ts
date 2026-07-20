import "server-only";
import { createRateLimiter } from "./index";

// CLAUDE.md rule #7 explicitly lists "chat message" as a required rate-limited endpoint.
export const sendMessageLimiter = createRateLimiter({
  limit: 60,
  windowSeconds: 60 * 60,
  prefix: "ratelimit:send-message",
});

export const startConversationLimiter = createRateLimiter({
  limit: 20,
  windowSeconds: 60 * 60,
  prefix: "ratelimit:start-conversation",
});
