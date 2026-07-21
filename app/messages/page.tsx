import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { listConversationsForUser } from "@/lib/chat/conversations";
import { buildImageUrl } from "@/lib/cloudinary/url";
import { relativeTime } from "@/lib/utils";
import { SiteHeader } from "@/components/organisms/SiteHeader";
import { BottomNavBar } from "@/components/organisms/BottomNavBar";

export default async function MessagesPage() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) redirect("/login?next=/messages");

  const conversations = await listConversationsForUser(authData.user.id);

  return (
    <div className="pb-24 md:pb-8">
      <SiteHeader />

      <main className="mx-auto max-w-3xl px-4 py-6">
        <h1 className="mb-4 text-xl font-bold">Messages</h1>

        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="bg-muted mb-6 flex h-24 w-24 items-center justify-center rounded-full">
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-muted-foreground"
              >
                <path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold">No conversations yet</h2>
            <p className="text-muted-foreground mt-2 max-w-xs text-sm">
              Start browsing ads and message sellers to see your chats here.
            </p>
            <Link
              href="/"
              className="bg-primary text-primary-foreground mt-6 rounded-xl px-6 py-3 text-sm font-semibold shadow-md transition-transform active:scale-95"
            >
              Browse Marketplace
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {conversations.map((c) => {
              const avatarUrl = c.otherAvatarUrl;
              const thumbnailUrl = c.adThumbnailPublicId
                ? buildImageUrl(
                    c.adThumbnailPublicId,
                    "w_100,h_100,c_fill,f_auto,q_auto",
                  )
                : null;
              return (
                <Link
                  key={c.id}
                  href={`/messages/${c.id}`}
                  className="hover:bg-muted flex items-center gap-3 rounded-xl p-3 transition-colors"
                >
                  <div className="bg-accent text-primary relative h-14 w-14 shrink-0 overflow-hidden rounded-full font-bold">
                    {avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element -- arbitrary external URL, see ad-detail-page rationale
                      <img
                        src={avatarUrl}
                        alt={c.otherDisplayName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-lg">
                        {c.otherDisplayName[0]?.toUpperCase() ?? "?"}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <h3 className="truncate text-sm font-semibold">
                        {c.otherDisplayName}
                      </h3>
                      <span className="text-muted-foreground shrink-0 text-[11px]">
                        {relativeTime(c.lastMessageAt ?? c.createdAt)}
                      </span>
                    </div>
                    <div className="text-primary mb-0.5 flex items-center gap-1">
                      {thumbnailUrl ? (
                        <div className="relative h-3.5 w-3.5 shrink-0 overflow-hidden rounded-sm">
                          <Image
                            src={thumbnailUrl}
                            alt=""
                            fill
                            sizes="14px"
                            className="object-cover"
                          />
                        </div>
                      ) : null}
                      <p className="truncate text-[11px] font-semibold tracking-wide uppercase">
                        {c.adTitle}
                      </p>
                    </div>
                    <p className="text-muted-foreground truncate text-sm">
                      {c.lastMessageContent ?? "No messages yet"}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>

      <BottomNavBar />
    </div>
  );
}
