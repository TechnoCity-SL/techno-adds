import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Minimal protected-route check, used to verify the session cookie actually works. */
export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  return NextResponse.json({ user: data.user });
}
