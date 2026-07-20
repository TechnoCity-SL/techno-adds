import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getConversationSummary } from "@/lib/chat/conversations";
import { listMessages } from "@/lib/chat/messages";
import { slugify } from "@/lib/utils";
import { MessageThread } from "@/components/organisms/MessageThread";

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) redirect(`/login?next=/messages/${id}`);

  const summary = await getConversationSummary(id, authData.user.id);
  if (!summary) notFound();

  const messages = await listMessages(id);

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <Link href="/messages" className="text-muted-foreground text-sm">
        ← Back to messages
      </Link>
      <h1 className="mt-2 text-lg font-semibold">{summary.otherDisplayName}</h1>
      <Link
        href={`/ad/${summary.adId}/${slugify(summary.adTitle)}`}
        className="text-primary text-sm"
      >
        {summary.adTitle}
      </Link>

      <MessageThread
        conversationId={id}
        currentUserId={authData.user.id}
        initialMessages={messages.map((m) => ({
          id: m.id,
          conversationId: m.conversationId,
          senderId: m.senderId,
          content: m.content,
          createdAt: m.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
