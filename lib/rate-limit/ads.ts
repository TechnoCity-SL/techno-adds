import "server-only";
import { createRateLimiter } from "./index";

// CLAUDE.md rule #7 explicitly lists "post-ad" as a required rate-limited endpoint.
export const postAdLimiter = createRateLimiter({
  limit: 10,
  windowSeconds: 24 * 60 * 60,
  prefix: "ratelimit:post-ad",
});
