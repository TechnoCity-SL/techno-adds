import { NextResponse } from "next/server";
import { requireModerator } from "@/lib/admin/require-moderator";
import { listPendingReports } from "@/lib/admin/reports";

export async function GET() {
  const moderator = await requireModerator();
  if (!moderator) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const reports = await listPendingReports();
  return NextResponse.json({ reports });
}
