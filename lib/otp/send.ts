import "server-only";
import { randomInt, randomUUID } from "node:crypto";
import { and, eq, isNull } from "drizzle-orm";
import { db, schema } from "@/lib/db/sqlite-client";
import { hashOtp } from "./hash";
import { sendSms } from "./providers/hutch";

/**
 * Targets the SQLite client directly (matches the local-dev decision in PLAN.md
 * §4.1). Swapping to Postgres for production requires the DB_DRIVER-based
 * unifier described there — not built yet, tracked as a pending item before
 * this ships to production, not silently forgotten.
 */

const OTP_TTL_MS = 5 * 60 * 1000;
export const PURPOSE_PHONE_VERIFY = "phone_verify";

export interface SendOtpResult {
  expiresAt: Date;
}

export async function sendPhoneOtp(phone: string): Promise<SendOtpResult> {
  const code = randomInt(0, 1_000_000).toString().padStart(6, "0");
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  // Invalidate any still-live codes for this phone so only the newest is ever valid.
  await db
    .delete(schema.otpCodes)
    .where(
      and(
        eq(schema.otpCodes.target, phone),
        eq(schema.otpCodes.purpose, PURPOSE_PHONE_VERIFY),
        isNull(schema.otpCodes.consumedAt),
      ),
    );

  await db.insert(schema.otpCodes).values({
    id: randomUUID(),
    target: phone,
    otpHash: hashOtp(code),
    purpose: PURPOSE_PHONE_VERIFY,
    expiresAt,
  });

  await sendSms(
    phone,
    `Your TechnoAds verification code is ${code}. It expires in 5 minutes.`,
  );

  return { expiresAt };
}
