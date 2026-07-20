import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdForViewing } from "@/lib/ads/get-ad";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();

  const detail = await getAdForViewing(id, authData.user?.id ?? null);
  if (!detail) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(detail);
}
