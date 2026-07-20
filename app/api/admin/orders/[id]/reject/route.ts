import { NextResponse } from "next/server";
import { requireModerator } from "@/lib/admin/require-moderator";
import {
  rejectBankTransfer,
  OrderNotAwaitingConfirmationError,
} from "@/lib/admin/orders";
import { rejectBankTransferSchema } from "@/lib/validation/bank-transfer";

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
  const parsed = rejectBankTransferSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    await rejectBankTransfer(moderator.userId, id, parsed.data.reason);
    return NextResponse.json({ status: "failed" });
  } catch (error) {
    if (error instanceof OrderNotAwaitingConfirmationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }
}
