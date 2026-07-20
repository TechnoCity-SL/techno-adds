import { NextResponse } from "next/server";
import { requireModerator } from "@/lib/admin/require-moderator";
import { expireTiers } from "@/lib/payments/expire-tiers";

// Manually-triggerable stand-in for real scheduling, same reasoning as
// /api/saved-searches/digest — gated behind requireModerator() until Vercel
// Cron is linked and a proper cron-secret trigger exists.
export async function POST() {
  const moderator = await requireModerator();
  if (!moderator) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const result = await expireTiers();
  return NextResponse.json(result);
}
