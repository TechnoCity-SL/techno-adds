import "server-only";
import { createRateLimiter } from "./index";

// CLAUDE.md rule #7 explicitly lists "report" as a required rate-limited endpoint.
export const reportLimiter = createRateLimiter({
  limit: 10,
  windowSeconds: 60 * 60,
  prefix: "ratelimit:report",
});
