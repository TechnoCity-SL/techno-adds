import "server-only";
import { createRateLimiter } from "./index";

// CLAUDE.md rule #7: rate limit every user-writable endpoint.
export const submitProofLimiter = createRateLimiter({
  limit: 10,
  windowSeconds: 60 * 60,
  prefix: "ratelimit:bank-transfer-proof",
});
