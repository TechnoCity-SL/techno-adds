import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { db, schema } from "@/lib/db/postgres-client";
import { updatePhoneVisibilitySchema } from "@/lib/validation/account";
import { accountUpdateLimiter } from "@/lib/rate-limit/account";
import { checkLimit } from "@/lib/rate-limit";

// Ownership is re-derived from the session on every request, never trusted
// from the [id] path param alone — CLAUDE.md rule #4.
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const limit = await checkLimit(accountUpdateLimiter, authData.user.id);
  if (!limit.success) {
    return NextResponse.json(
      { error: "Too many requests. Try again later." },
      { status: 429 },
    );
  }

  const body = await request.json().catch(() => ({}));
  const parsed = updatePhoneVisibilitySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const [updated] = await db
    .update(schema.userPhoneNumbers)
    .set({ isHidden: parsed.data.isHidden })
    .where(
      and(
        eq(schema.userPhoneNumbers.id, id),
        eq(schema.userPhoneNumbers.userId, authData.user.id),
      ),
    )
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ phoneNumber: updated });
}
