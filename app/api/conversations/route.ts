import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { startConversationSchema } from "@/lib/validation/chat";
import {
  getOrCreateConversation,
  listConversationsForUser,
  AdNotFoundError,
  CannotMessageOwnAdError,
} from "@/lib/chat/conversations";
import { startConversationLimiter } from "@/lib/rate-limit/chat";
import { checkLimit } from "@/lib/rate-limit";

export async function GET() {
  const supabase = await createClient();
  const { data: authData, error } = await supabase.auth.getUser();

  if (error || !authData.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const conversations = await listConversationsForUser(authData.user.id);
  return NextResponse.json({ conversations });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const limit = await checkLimit(startConversationLimiter, authData.user.id);
  if (!limit.success) {
    return NextResponse.json(
      { error: "Too many conversations started. Try again later." },
      { status: 429 },
    );
  }

  const body = await request.json().catch(() => ({}));
  const parsed = startConversationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const conversationId = await getOrCreateConversation(
      authData.user.id,
      parsed.data.adId,
    );
    return NextResponse.json({ id: conversationId }, { status: 201 });
  } catch (error) {
    if (error instanceof AdNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof CannotMessageOwnAdError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("getOrCreateConversation failed:", error);
    return NextResponse.json(
      { error: "Failed to start conversation" },
      { status: 500 },
    );
  }
}
