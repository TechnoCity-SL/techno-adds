import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { getConversationSummary } from "@/lib/chat/conversations";
import { listMessages } from "@/lib/chat/messages";
import { slugify } from "@/lib/utils";
import { buildImageUrl } from "@/lib/cloudinary/url";
import { BackButton } from "@/components/molecules/BackButton";
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
  const adThumbnailUrl = summary.adThumbnailPublicId
    ? buildImageUrl(
        summary.adThumbnailPublicId,
        "w_100,h_100,c_fill,f_auto,q_auto",
      )
    : null;

  return (
    <div className="flex h-screen flex-col">
      <header className="bg-card sticky top-0 z-20 shadow-sm">
        <div className="mx-auto flex max-w-3xl items-center gap-2 px-2 py-2">
          <BackButton />
          <div className="bg-accent text-primary relative h-10 w-10 shrink-0 overflow-hidden rounded-full font-bold">
            {summary.otherAvatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- arbitrary external URL, see ad-detail-page rationale
              <img
                src={summary.otherAvatarUrl}
                alt={summary.otherDisplayName}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center">
                {summary.otherDisplayName[0]?.toUpperCase() ?? "?"}
              </span>
            )}
          </div>
          <h1 className="truncate text-base font-bold">
            {summary.otherDisplayName}
          </h1>
        </div>

        <Link
          href={`/ad/${summary.adId}/${slugify(summary.adTitle)}`}
          className="border-border mx-auto flex max-w-3xl items-center gap-3 border-t px-4 py-2"
        >
          {adThumbnailUrl ? (
            <div className="bg-muted relative h-10 w-10 shrink-0 overflow-hidden rounded-lg">
              <Image
                src={adThumbnailUrl}
                alt=""
                fill
                sizes="40px"
                className="object-cover"
              />
            </div>
          ) : null}
          <div className="min-w-0">
            <p className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">
              Regarding Ad
            </p>
            <p className="text-primary truncate text-sm font-semibold">
              {summary.adTitle}
            </p>
          </div>
        </Link>
      </header>

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
