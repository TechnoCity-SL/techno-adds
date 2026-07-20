import { NextResponse } from "next/server";
import { requireModerator } from "@/lib/admin/require-moderator";
import { listAwaitingConfirmationOrders } from "@/lib/admin/orders";

export async function GET() {
  const moderator = await requireModerator();
  if (!moderator) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const orders = await listAwaitingConfirmationOrders();
  return NextResponse.json({ orders });
}
