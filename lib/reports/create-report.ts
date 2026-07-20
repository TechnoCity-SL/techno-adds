import "server-only";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db/postgres-client";

export class InvalidTargetError extends Error {}

export type ReportTargetType = "ad" | "user";

// targetId is polymorphic (an ads.id or a users.id depending on targetType,
// same as moderation_actions.targetId) so there's no FK to lean on — this
// existence check is the only thing standing between a report and a
// dangling reference the moderation queue can't resolve.
export async function createReport(
  reporterUserId: string,
  targetType: ReportTargetType,
  targetId: string,
  reason: string,
): Promise<string> {
  if (targetType === "ad") {
    const [ad] = await db
      .select({ id: schema.ads.id })
      .from(schema.ads)
      .where(eq(schema.ads.id, targetId));
    if (!ad) throw new InvalidTargetError(`Unknown ad: ${targetId}`);
  } else {
    const [user] = await db
      .select({ id: schema.users.id })
      .from(schema.users)
      .where(eq(schema.users.id, targetId));
    if (!user) throw new InvalidTargetError(`Unknown user: ${targetId}`);
  }

  const id = randomUUID();
  await db.insert(schema.reports).values({
    id,
    reporterUserId,
    targetType,
    targetId,
    reason,
  });
  return id;
}
