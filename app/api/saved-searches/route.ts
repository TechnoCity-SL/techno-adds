import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { saveSearchSchema } from "@/lib/validation/saved-searches";
import {
  createSavedSearch,
  listSavedSearches,
} from "@/lib/saved-searches/manage";
import { saveSearchLimiter } from "@/lib/rate-limit/saved-searches";
import { checkLimit } from "@/lib/rate-limit";

export async function GET() {
  const supabase = await createClient();
  const { data: authData, error } = await supabase.auth.getUser();

  if (error || !authData.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const savedSearches = await listSavedSearches(authData.user.id);
  return NextResponse.json({ savedSearches });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const limit = await checkLimit(saveSearchLimiter, authData.user.id);
  if (!limit.success) {
    return NextResponse.json(
      { error: "Too many saved searches. Try again later." },
      { status: 429 },
    );
  }

  const body = await request.json().catch(() => ({}));
  const parsed = saveSearchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const id = await createSavedSearch(authData.user.id, parsed.data.q);
  return NextResponse.json({ id }, { status: 201 });
}
