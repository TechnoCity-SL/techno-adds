import "server-only";
import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "./client";

/**
 * Shared rate-limit factory per CLAUDE.md rule #7 — every user-writable
 * endpoint gets its limiter(s) from here, never a one-off Redis call inline
 * in a route handler.
 */
export function createRateLimiter(opts: {
  limit: number;
  windowSeconds: number;
  prefix: string;
}) {
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(opts.limit, `${opts.windowSeconds} s`),
    prefix: opts.prefix,
  });
}

export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

const isUpstashConfigured = Boolean(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN,
);
let warnedAboutMissingUpstash = false;

/**
 * Fails OPEN (allows the request) when Upstash isn't configured, instead of
 * every route needing its own fallback. This is a deliberate, tracked gap —
 * see PLAN.md Phase 1 status — not a permanent design. Every skipped check
 * logs a warning so it's impossible to miss in logs, and CLAUDE.md rule #7
 * still requires this closed before any real user traffic hits these routes.
 */
export async function checkLimit(
  limiter: Ratelimit,
  key: string,
): Promise<{ success: boolean }> {
  if (!isUpstashConfigured) {
    if (!warnedAboutMissingUpstash) {
      console.warn(
        "[rate-limit] UPSTASH_REDIS_REST_URL/TOKEN not set — rate limiting is DISABLED (failing open). " +
          "Tracked gap, see PLAN.md Phase 1 status. Must be closed before real users hit these endpoints.",
      );
      warnedAboutMissingUpstash = true;
    }
    return { success: true };
  }
  return limiter.limit(key);
}
