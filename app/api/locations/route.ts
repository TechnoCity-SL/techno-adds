import { NextResponse } from "next/server";
import { db, schema } from "@/lib/db/postgres-client";

export async function GET() {
  const locations = await db.select().from(schema.locations);
  return NextResponse.json({ locations });
}
