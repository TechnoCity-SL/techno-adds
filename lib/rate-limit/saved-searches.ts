import "server-only";
import { createRateLimiter } from "./index";

// CLAUDE.md rule #7: rate limit every user-writable endpoint.
export const saveSearchLimiter = createRateLimiter({
  limit: 30,
  windowSeconds: 60 * 60,
  prefix: "ratelimit:save-search",
});
