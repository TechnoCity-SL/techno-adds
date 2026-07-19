import "server-only";
import { and, desc, eq, isNull } from "drizzle-orm";
import { db, schema } from "@/lib/db/sqlite-client";
import { hashOtp } from "./hash";
import { PURPOSE_PHONE_VERIFY } from "./send";

const MAX_ATTEMPTS = 5;

export type VerifyOtpResult =
  | { ok: true }
  | {
      ok: false;
      reason: "not_found" | "expired" | "too_many_attempts" | "incorrect_code";
    };

/**
 * Proves the caller controls `phone` right now — nothing more. Attaching a
 * verified phone number to a specific user's `user_phone_numbers` row is a
 * separate step that needs a real authenticated session (Supabase Auth,
 * not built yet in this repo). Deliberately not wired here: a client-submitted
 * user_id would violate CLAUDE.md rule #4 (never trust client-submitted
 * ownership) — there's no secure way to do that linkage until sessions exist.
 */
export async function verifyPhoneOtp(
  phone: string,
  code: string,
): Promise<VerifyOtpResult> {
  const [row] = await db
    .select()
    .from(schema.otpCodes)
    .where(
      and(
        eq(schema.otpCodes.target, phone),
        eq(schema.otpCodes.purpose, PURPOSE_PHONE_VERIFY),
        isNull(schema.otpCodes.consumedAt),
      ),
    )
    .orderBy(desc(schema.otpCodes.createdAt))
    .limit(1);

  if (!row) return { ok: false, reason: "not_found" };
  if (row.expiresAt.getTime() < Date.now())
    return { ok: false, reason: "expired" };
  if (row.attemptCount >= MAX_ATTEMPTS)
    return { ok: false, reason: "too_many_attempts" };

  if (row.otpHash !== hashOtp(code)) {
    await db
      .update(schema.otpCodes)
      .set({ attemptCount: row.attemptCount + 1 })
      .where(eq(schema.otpCodes.id, row.id));
    return { ok: false, reason: "incorrect_code" };
  }

  await db
    .update(schema.otpCodes)
    .set({ consumedAt: new Date() })
    .where(eq(schema.otpCodes.id, row.id));
  return { ok: true };
}
