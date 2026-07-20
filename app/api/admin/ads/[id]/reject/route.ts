import { NextResponse } from "next/server";
import { requireModerator } from "@/lib/admin/require-moderator";
import { rejectAd, AdNotPendingError } from "@/lib/admin/moderation";
import { moderationReasonSchema } from "@/lib/validation/admin";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const moderator = await requireModerator();
  if (!moderator) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const parsed = moderationReasonSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    await rejectAd(moderator.userId, id, parsed.data.reason);
    return NextResponse.json({ status: "rejected" });
  } catch (error) {
    if (error instanceof AdNotPendingError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }
}
