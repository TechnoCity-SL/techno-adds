import { NextResponse } from "next/server";
import { requireModerator } from "@/lib/admin/require-moderator";
import { unbanUser } from "@/lib/admin/moderation";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const moderator = await requireModerator();
  if (!moderator) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  await unbanUser(moderator.userId, id);
  return NextResponse.json({ banned: false });
}
