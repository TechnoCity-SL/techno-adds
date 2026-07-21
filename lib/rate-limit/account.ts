import "server-only";
import { createRateLimiter } from "./index";

// Covers both display-name updates and phone-visibility toggles — low-value,
// low-cost mutations that still need a cap per CLAUDE.md rule #7, but don't
// warrant the finer per-field limiters other flows (OTP, ads) have.
export const accountUpdateLimiter = createRateLimiter({
  limit: 20,
  windowSeconds: 60 * 60,
  prefix: "ratelimit:account-update",
});
