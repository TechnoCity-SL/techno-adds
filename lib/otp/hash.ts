import { createHash } from "node:crypto";

// The 5-minute expiry + 5-attempt cap (see send.ts/verify.ts) are the real defense
// against brute force on a 6-digit space — a plain hash is standard practice here,
// unlike password storage, where the threat model calls for a slow KDF instead.
export function hashOtp(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}
