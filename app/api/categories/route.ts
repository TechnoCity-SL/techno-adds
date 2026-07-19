import { NextResponse } from "next/server";
import { db, schema } from "@/lib/db/postgres-client";

export async function GET() {
  const categories = await db.select().from(schema.categories);
  return NextResponse.json({ categories });
}
