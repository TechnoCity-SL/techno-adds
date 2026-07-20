import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isModerator, listPendingAds } from "@/lib/admin/moderation";
import { listPendingReports } from "@/lib/admin/reports";
import { listAwaitingConfirmationOrders } from "@/lib/admin/orders";
import { buildImageUrl } from "@/lib/cloudinary/url";
import { ModerationQueue } from "@/components/organisms/ModerationQueue";
import { ReportQueue } from "@/components/organisms/ReportQueue";
import { OrderReviewQueue } from "@/components/organisms/OrderReviewQueue";

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

  return (
    <>
      <ModerationQueue
        initialAds={ads.map((ad) => ({
          id: ad.id,
          title: ad.title,
          price: ad.price,
        }))}
      />
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
    </>
  );
}
