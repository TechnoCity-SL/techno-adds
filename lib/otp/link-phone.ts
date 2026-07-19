import "server-only";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db/postgres-client";

/**
 * Unlike lib/otp/{send,verify}.ts (which target SQLite — see PLAN.md §4.1),
 * this targets Postgres directly. Reason: `userId` here is a real Supabase
 * Auth user id, and that user only actually exists in Postgres (auth.users +
 * the public.users row the trigger creates) — there is no matching row in
 * local SQLite to attach a phone number to. OTP mechanics themselves don't
 * need a real user (otp_codes.target is just a phone/email string), so those
 * stay on SQLite; only this user-scoped linkage step needs Postgres.
 */
export async function linkVerifiedPhoneNumber(userId: string, phone: string) {
  const [row] = await db
    .insert(schema.userPhoneNumbers)
    .values({
      id: randomUUID(),
      userId,
      phoneE164: phone,
      isVerified: true,
      verifiedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [
        schema.userPhoneNumbers.userId,
        schema.userPhoneNumbers.phoneE164,
      ],
      set: { isVerified: true, verifiedAt: new Date() },
    })
    .returning();

  return row;
}

export async function listPhoneNumbers(userId: string) {
  return db
    .select()
    .from(schema.userPhoneNumbers)
    .where(eq(schema.userPhoneNumbers.userId, userId));
}
