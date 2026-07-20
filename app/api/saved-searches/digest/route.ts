import { NextResponse } from "next/server";
import { requireModerator } from "@/lib/admin/require-moderator";
import { runSavedSearchDigest } from "@/lib/notifications/saved-search-digest";

// Manually-triggerable stand-in for real scheduling: Vercel Cron isn't linked
// yet (PLAN.md Phase 0 status), and there's no CRON_SECRET-style trigger auth
// set up either, so this is gated behind requireModerator() for now rather
// than left open — it touches every user's saved searches, not just the
// caller's own. Replace with a real cron + secret once Vercel is linked.
export async function POST() {
  const moderator = await requireModerator();
  if (!moderator) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const digest = await runSavedSearchDigest();
  return NextResponse.json({ digest });
}
