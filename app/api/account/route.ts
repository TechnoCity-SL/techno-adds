import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { db, schema } from "@/lib/db/postgres-client";
import { updateDisplayNameSchema } from "@/lib/validation/account";
import { accountUpdateLimiter } from "@/lib/rate-limit/account";
import { checkLimit } from "@/lib/rate-limit";

export async function PATCH(request: Request) {
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
  const parsed = updateDisplayNameSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const [updated] = await db
    .update(schema.users)
    .set({ displayName: parsed.data.displayName })
    .where(eq(schema.users.id, authData.user.id))
    .returning();

  return NextResponse.json({ user: updated });
}
