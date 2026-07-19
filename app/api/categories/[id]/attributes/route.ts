import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db/postgres-client";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const attributes = await db
    .select()
    .from(schema.categoryAttributes)
    .where(eq(schema.categoryAttributes.categoryId, id))
    .orderBy(asc(schema.categoryAttributes.sortOrder));

  const parsed = attributes.map((attr) => ({
    ...attr,
    options: attr.options ? (JSON.parse(attr.options) as string[]) : null,
  }));

  return NextResponse.json({ attributes: parsed });
}
