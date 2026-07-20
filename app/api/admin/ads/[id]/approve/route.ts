import { NextResponse } from "next/server";
import { requireModerator } from "@/lib/admin/require-moderator";
import { approveAd, AdNotPendingError } from "@/lib/admin/moderation";

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
    await approveAd(moderator.userId, id);
    return NextResponse.json({ status: "active" });
  } catch (error) {
    if (error instanceof AdNotPendingError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }
}
