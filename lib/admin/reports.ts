import "server-only";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db/postgres-client";
import { logModerationAction } from "./moderation";

export class ReportNotPendingError extends Error {}

export async function listPendingReports() {
  return db
    .select()
    .from(schema.reports)
    .where(eq(schema.reports.status, "pending"))
    .orderBy(desc(schema.reports.createdAt));
}

export async function resolveReport(
  moderatorId: string,
  reportId: string,
  status: "resolved" | "dismissed",
): Promise<void> {
  const [report] = await db
    .select()
    .from(schema.reports)
    .where(eq(schema.reports.id, reportId));
  if (!report || report.status !== "pending") {
    throw new ReportNotPendingError(`Report ${reportId} is not pending`);
  }

  await db
    .update(schema.reports)
    .set({ status })
    .where(eq(schema.reports.id, reportId));

  await logModerationAction(
    moderatorId,
    report.targetType as "ad" | "user",
    report.targetId,
    status === "resolved" ? "resolve_report" : "dismiss_report",
  );
}
