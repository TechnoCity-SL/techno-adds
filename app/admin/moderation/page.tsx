import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isModerator, listPendingAds } from "@/lib/admin/moderation";
import { listPendingReports } from "@/lib/admin/reports";
import { listAwaitingConfirmationOrders } from "@/lib/admin/orders";
import { buildImageUrl } from "@/lib/cloudinary/url";
import { ModerationQueue } from "@/components/organisms/ModerationQueue";
import { ReportQueue } from "@/components/organisms/ReportQueue";
import { OrderReviewQueue } from "@/components/organisms/OrderReviewQueue";

const STATS = [
  {
    key: "ads",
    label: "Pending Ads",
    iconClassName: "bg-accent text-primary",
    icon: <path d="M4 7h16M4 12h16M4 17h10" />,
  },
  {
    key: "reports",
    label: "Active Reports",
    iconClassName: "bg-destructive/10 text-destructive",
    icon: (
      <>
        <path d="M12 9v4M12 17h.01" />
        <path d="M10.29 3.86 1.82 18a1 1 0 0 0 .86 1.5h18.64a1 1 0 0 0 .86-1.5L13.71 3.86a1 1 0 0 0-1.72 0Z" />
      </>
    ),
  },
  {
    key: "orders",
    label: "Pending Transfers",
    iconClassName: "bg-muted text-muted-foreground",
    icon: (
      <path d="M3 21h18M4 10h16M12 3 3 8h18ZM6 10v8M10 10v8M14 10v8M18 10v8" />
    ),
  },
] as const;

export default async function ModerationPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect("/login?next=/admin/moderation");
  }

  // 404, not 403: don't reveal that this admin route exists to non-moderators.
  const moderator = await isModerator(data.user.id);
  if (!moderator) {
    notFound();
  }

  const [ads, reports, awaitingOrders] = await Promise.all([
    listPendingAds(),
    listPendingReports(),
    listAwaitingConfirmationOrders(),
  ]);

  const counts = {
    ads: ads.length,
    reports: reports.length,
    orders: awaitingOrders.length,
  };

  return (
    <div className="bg-muted/30 min-h-screen">
      <div className="mx-auto max-w-[1400px] px-4 py-6">
        <header className="bg-card border-border mb-6 rounded-2xl border p-5 shadow-sm">
          <h1 className="text-primary text-xl font-bold">
            Moderation Overview
          </h1>
          <p className="text-muted-foreground text-sm">
            Reviewing pending listings, reports, and payment confirmations.
          </p>
        </header>

        <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {STATS.map((stat) => (
            <div
              key={stat.key}
              className="bg-card border-border flex items-center gap-4 rounded-2xl border p-4 shadow-sm"
            >
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${stat.iconClassName}`}
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {stat.icon}
                </svg>
              </div>
              <div>
                <p className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">
                  {stat.label}
                </p>
                <p className="text-xl font-bold">{counts[stat.key]}</p>
              </div>
            </div>
          ))}
        </section>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <ModerationQueue
              initialAds={ads.map((ad) => ({
                id: ad.id,
                title: ad.title,
                price: ad.price,
              }))}
            />
          </div>
          <div className="flex flex-col gap-6 lg:col-span-4">
            <ReportQueue
              initialReports={reports.map((r) => ({
                id: r.id,
                targetType: r.targetType,
                targetId: r.targetId,
                reason: r.reason,
              }))}
            />
            <OrderReviewQueue
              initialOrders={awaitingOrders.map((row) => ({
                id: row.order.id,
                adTitle: row.ad.title,
                amountLkr: row.order.amountLkr,
                tier: row.product.tier,
                durationDays: row.product.durationDays,
                receiptUrl: buildImageUrl(
                  row.proof.cloudinaryPublicId,
                  "w_200,h_200,c_fill,f_auto,q_auto",
                ),
              }))}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
