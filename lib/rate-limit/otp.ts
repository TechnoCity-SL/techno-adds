import "server-only";
import { createRateLimiter } from "./index";

// Per PLAN.md §5.4: cap OTP sends per-phone AND per-IP — SMS costs money per
// message, so this is the primary defense against cost-abuse, not just spam.
export const otpSendPhoneLimiter = createRateLimiter({
  limit: 3,
  windowSeconds: 60 * 60,
  prefix: "ratelimit:otp:phone",
});

export const otpSendIpLimiter = createRateLimiter({
  limit: 10,
  windowSeconds: 60 * 60,
  prefix: "ratelimit:otp:ip",
});

// Verify already caps wrong guesses per-code via otp_codes.attempt_count (see
// lib/otp/verify.ts), but this stops an attacker from mass-probing many phone
// numbers from one IP.
export const otpVerifyIpLimiter = createRateLimiter({
  limit: 20,
  windowSeconds: 60 * 60,
  prefix: "ratelimit:otp-verify:ip",
});
