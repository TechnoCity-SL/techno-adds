import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendMessageSchema } from "@/lib/validation/chat";
import { isConversationParticipant } from "@/lib/chat/conversations";
import { sendMessage, listMessages } from "@/lib/chat/messages";
import { sendMessageLimiter } from "@/lib/rate-limit/chat";
import { checkLimit } from "@/lib/rate-limit";

// Ownership check here (not just RLS) is the real enforcement for this route,
// same as every other Postgres-backed route: lib/db/postgres-client.ts connects
// as the plain `postgres` role, which bypasses RLS entirely (CLAUDE.md rule #4).

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: authData, error } = await supabase.auth.getUser();

  if (error || !authData.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const isParticipant = await isConversationParticipant(id, authData.user.id);
  if (!isParticipant) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const messages = await listMessages(id);
  return NextResponse.json({ messages });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const limit = await checkLimit(sendMessageLimiter, authData.user.id);
  if (!limit.success) {
    return NextResponse.json(
      { error: "Too many messages sent. Try again later." },
      { status: 429 },
    );
  }

  const isParticipant = await isConversationParticipant(id, authData.user.id);
  if (!isParticipant) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = sendMessageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const message = await sendMessage(id, authData.user.id, parsed.data.content);
  return NextResponse.json({ message }, { status: 201 });
}
