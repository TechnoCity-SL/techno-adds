import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { listOwnAds } from "@/lib/ads/list-own-ads";
import { slugify } from "@/lib/utils";

function statusLabel(status: string): string {
  return status
    .split("_")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

export default async function MyAdsPage() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) redirect("/login?next=/my-ads");

  const ads = await listOwnAds(authData.user.id);

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="mb-4 text-xl font-semibold">My Ads</h1>

      {ads.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          You haven&apos;t posted any ads yet.{" "}
          <Link href="/post-ad" className="text-primary">
            Post your first ad
          </Link>
          .
        </p>
      ) : (
        <ul className="divide-border divide-y">
          {ads.map((ad) => (
            <li
              key={ad.id}
              className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <Link
                  href={`/ad/${ad.id}/${slugify(ad.title)}`}
                  className="truncate text-sm font-medium"
                >
                  {ad.title}
                </Link>
                <p className="text-muted-foreground text-xs">
                  Rs. {ad.price.toLocaleString()} · {statusLabel(ad.status)}
                  {ad.listingTier !== "standard"
                    ? ` · ${statusLabel(ad.listingTier)}${
                        ad.tierExpiresAt
                          ? ` (until ${ad.tierExpiresAt.toLocaleDateString()})`
                          : ""
                      }`
                    : ""}
                </p>
              </div>
              {ad.status === "active" ? (
                <Link
                  href={`/my-ads/${ad.id}/boost`}
                  className="border-border shrink-0 rounded-md border px-3 py-1.5 text-center text-sm font-medium"
                >
                  {ad.listingTier === "standard"
                    ? "Boost this ad"
                    : "Extend boost"}
                </Link>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
