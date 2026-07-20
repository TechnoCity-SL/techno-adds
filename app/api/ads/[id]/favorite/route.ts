import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdForViewing } from "@/lib/ads/get-ad";
import { addFavorite, removeFavorite } from "@/lib/ads/favorites";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: authData, error } = await supabase.auth.getUser();

  if (error || !authData.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const detail = await getAdForViewing(id, authData.user.id);
  if (!detail) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await addFavorite(authData.user.id, id);
  return NextResponse.json({ favorited: true });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: authData, error } = await supabase.auth.getUser();

  if (error || !authData.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  await removeFavorite(authData.user.id, id);
  return NextResponse.json({ favorited: false });
}
