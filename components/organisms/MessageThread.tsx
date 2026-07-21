"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

function formatClockTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

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
    <div className="bg-background flex flex-1 flex-col overflow-hidden">
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.map((m) => {
          const isOwn = m.senderId === currentUserId;
          return (
            <div
              key={m.id}
              className={`flex max-w-[85%] flex-col gap-1 ${isOwn ? "ml-auto items-end" : "items-start"}`}
            >
              <div
                className={`px-4 py-2.5 text-sm shadow-sm ${
                  isOwn
                    ? "bg-primary text-primary-foreground rounded-tl-2xl rounded-tr-sm rounded-b-2xl"
                    : "bg-muted rounded-tl-sm rounded-tr-2xl rounded-b-2xl"
                }`}
              >
                {m.content}
              </div>
              <span className="text-muted-foreground text-[11px]">
                {formatClockTime(m.createdAt)}
              </span>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {error ? (
        <p className="text-destructive px-4 pb-2 text-sm">{error}</p>
      ) : null}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
        className="bg-card border-border flex items-center gap-3 border-t px-4 py-3"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          maxLength={2000}
          className="bg-muted border-border focus:border-primary focus:ring-primary/30 h-12 flex-1 rounded-full border px-4 text-sm focus:ring-1 focus:outline-none"
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          className="bg-primary text-primary-foreground flex h-12 items-center gap-2 rounded-full px-5 text-sm font-semibold shadow-md transition-transform active:scale-95 disabled:opacity-50"
        >
          Send
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m22 2-7 20-4-9-9-4Z" />
            <path d="M22 2 11 13" />
          </svg>
        </button>
      </form>
    </div>
  );
}
