import { NextResponse } from "next/server";
import { requireModerator } from "@/lib/admin/require-moderator";
import { resolveReport, ReportNotPendingError } from "@/lib/admin/reports";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const moderator = await requireModerator();
  if (!moderator) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    await resolveReport(moderator.userId, id, "resolved");
    return NextResponse.json({ status: "resolved" });
  } catch (error) {
    if (error instanceof ReportNotPendingError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }
}
