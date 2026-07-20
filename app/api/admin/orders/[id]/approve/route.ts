import { NextResponse } from "next/server";
import { requireModerator } from "@/lib/admin/require-moderator";
import {
  approveBankTransfer,
  OrderNotAwaitingConfirmationError,
} from "@/lib/admin/orders";

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
    await approveBankTransfer(moderator.userId, id);
    return NextResponse.json({ status: "paid" });
  } catch (error) {
    if (error instanceof OrderNotAwaitingConfirmationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }
}
