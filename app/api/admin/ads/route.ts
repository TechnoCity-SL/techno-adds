import { NextResponse } from "next/server";
import { requireModerator } from "@/lib/admin/require-moderator";
import { listPendingAds } from "@/lib/admin/moderation";

export async function GET() {
  const moderator = await requireModerator();
  if (!moderator) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const ads = await listPendingAds();
  return NextResponse.json({ ads });
}
