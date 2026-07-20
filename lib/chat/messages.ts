import "server-only";
import { randomUUID } from "node:crypto";
import { asc, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db/postgres-client";

export type MessageItem = typeof schema.messages.$inferSelect;

export async function sendMessage(
  conversationId: string,
  senderId: string,
  content: string,
): Promise<MessageItem> {
  const [row] = await db
    .insert(schema.messages)
    .values({ id: randomUUID(), conversationId, senderId, content })
    .returning();
  return row;
}

export async function listMessages(
  conversationId: string,
): Promise<MessageItem[]> {
  return db
    .select()
    .from(schema.messages)
    .where(eq(schema.messages.conversationId, conversationId))
    .orderBy(asc(schema.messages.createdAt));
}
