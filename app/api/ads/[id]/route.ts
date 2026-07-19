import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { db, schema } from "@/lib/db/postgres-client";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const [ad] = await db.select().from(schema.ads).where(eq(schema.ads.id, id));
  if (!ad) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const isOwner = authData.user?.id === ad.userId;

  /**
   * Mirrors the `ads_select_active_or_own` RLS policy in application code.
   * Our server-side Postgres connection (lib/db/postgres-client.ts) uses the
   * plain `postgres` role from DATABASE_URL, which BYPASSES RLS entirely —
   * RLS only actually applies to direct client access via Supabase's Data API
   * (anon/authenticated roles). So for this route, this check is the only
   * thing enforcing "can user A see user B's draft ad?" — exactly why
   * CLAUDE.md rule #4 requires server-side auth in addition to RLS, not
   * instead of it.
   */
  if (ad.status !== "active" && !isOwner) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const attributeValues = await db
    .select({
      key: schema.categoryAttributes.key,
      label: schema.categoryAttributes.label,
      value: schema.adAttributeValues.value,
    })
    .from(schema.adAttributeValues)
    .innerJoin(
      schema.categoryAttributes,
      eq(
        schema.adAttributeValues.categoryAttributeId,
        schema.categoryAttributes.id,
      ),
    )
    .where(eq(schema.adAttributeValues.adId, id));

  const images = await db
    .select()
    .from(schema.adImages)
    .where(eq(schema.adImages.adId, id));

  return NextResponse.json({ ad, attributes: attributeValues, images });
}
