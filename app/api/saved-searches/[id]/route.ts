import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { deleteSavedSearch } from "@/lib/saved-searches/manage";

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

  await deleteSavedSearch(authData.user.id, id);
  return NextResponse.json({ deleted: true });
}
