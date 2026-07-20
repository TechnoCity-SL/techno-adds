import "server-only";
import { createRateLimiter } from "./index";

// CLAUDE.md rule #7: rate limit every user-writable endpoint.
export const createOrderLimiter = createRateLimiter({
  limit: 20,
  windowSeconds: 60 * 60,
  prefix: "ratelimit:create-order",
});
