import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isModerator, listPendingAds } from "@/lib/admin/moderation";
import { listPendingReports } from "@/lib/admin/reports";
import { ModerationQueue } from "@/components/organisms/ModerationQueue";
import { ReportQueue } from "@/components/organisms/ReportQueue";

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

  const [ads, reports] = await Promise.all([
    listPendingAds(),
    listPendingReports(),
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
    </>
  );
}
