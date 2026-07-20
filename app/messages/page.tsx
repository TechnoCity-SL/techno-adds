import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { listConversationsForUser } from "@/lib/chat/conversations";

export default async function MessagesPage() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) redirect("/login?next=/messages");

  const conversations = await listConversationsForUser(authData.user.id);

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="mb-4 text-xl font-semibold">Messages</h1>

      {conversations.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No conversations yet. Message a seller from an ad to start one.
        </p>
      ) : (
        <ul className="divide-border divide-y">
          {conversations.map((c) => (
            <li key={c.id}>
              <Link
                href={`/messages/${c.id}`}
                className="hover:bg-muted/50 flex items-center justify-between gap-3 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {c.otherDisplayName}
                  </p>
                  <p className="text-muted-foreground truncate text-xs">
                    {c.adTitle}
                  </p>
                  {c.lastMessageContent ? (
                    <p className="text-muted-foreground mt-1 truncate text-sm">
                      {c.lastMessageContent}
                    </p>
                  ) : null}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
