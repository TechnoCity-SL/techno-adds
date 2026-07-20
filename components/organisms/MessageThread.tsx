"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
}

interface MessageThreadProps {
  conversationId: string;
  currentUserId: string;
  initialMessages: Message[];
}

export function MessageThread({
  conversationId,
  currentUserId,
  initialMessages,
}: MessageThreadProps) {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Realtime delivery relies on the participant-only RLS SELECT policy on
  // `messages` (drizzle/postgres/0019_phase4_chat_rls.sql) — Supabase only
  // broadcasts postgres_changes rows the subscribing user's own policies
  // allow them to see, so this filter isn't the only thing keeping the other
  // conversation's messages out, RLS is.
  //
  // Found live in testing: subscribing immediately races createBrowserClient's
  // async cookie-based session hydration — the socket can finish its "SUBSCRIBED"
  // handshake on the anon role before the user's JWT is attached, so every row
  // gets silently dropped by RLS (no error, it just never arrives). Explicitly
  // awaiting getSession() and calling realtime.setAuth() before subscribing
  // closes that race.
  useEffect(() => {
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;

    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (cancelled) return;
      if (session) {
        await supabase.realtime.setAuth(session.access_token);
      }
      if (cancelled) return;

      channel = supabase
        .channel(`messages:${conversationId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `conversation_id=eq.${conversationId}`,
          },
          (payload) => {
            const row = payload.new as {
              id: string;
              conversation_id: string;
              sender_id: string;
              content: string;
              created_at: string;
            };
            setMessages((prev) =>
              prev.some((m) => m.id === row.id)
                ? prev
                : [
                    ...prev,
                    {
                      id: row.id,
                      conversationId: row.conversation_id,
                      senderId: row.sender_id,
                      content: row.content,
                      createdAt: row.created_at,
                    },
                  ],
            );
          },
        )
        .subscribe();
    })();

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function send() {
    const content = input.trim();
    if (!content) return;
    setSending(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/conversations/${conversationId}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        },
      );
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Failed to send message.");
        return;
      }
      // Own message may also arrive via the Realtime subscription above;
      // dedupe by id so it doesn't render twice.
      setMessages((prev) =>
        prev.some((m) => m.id === data.message.id)
          ? prev
          : [...prev, data.message],
      );
      setInput("");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-[65vh] flex-col">
      <div className="flex-1 space-y-2 overflow-y-auto py-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
              m.senderId === currentUserId
                ? "bg-primary text-primary-foreground ml-auto"
                : "bg-muted"
            }`}
          >
            {m.content}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
        className="border-border flex gap-2 border-t pt-3"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          maxLength={2000}
          className="border-border flex-1 rounded-md border px-3 py-2.5 text-sm"
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          className="bg-primary text-primary-foreground rounded-md px-4 py-2.5 text-sm font-medium disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
