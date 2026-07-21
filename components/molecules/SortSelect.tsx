"use client";

import { useRouter } from "next/navigation";
import type { AdSort } from "@/lib/ads/list-ads";

const SORT_LABELS: Record<Exclude<AdSort, "relevance">, string> = {
  newest: "Newest First",
  price_asc: "Price: Low to High",
  price_desc: "Price: High to Low",
};

export function SortSelect({
  sort,
  basePath,
  queryString,
}: {
  sort: AdSort;
  basePath: string;
  /** Everything except `sort` and `page`, e.g. "&q=toyota&minPrice=100000". */
  queryString: string;
}) {
  const router = useRouter();

  return (
    <select
      value={sort in SORT_LABELS ? sort : "newest"}
      onChange={(e) => {
        router.push(`${basePath}?sort=${e.target.value}${queryString}`);
      }}
      className="border-border bg-card text-foreground rounded-lg px-4 py-2 text-sm font-semibold outline-none"
    >
      {(Object.keys(SORT_LABELS) as (keyof typeof SORT_LABELS)[]).map((s) => (
        <option key={s} value={s}>
          {SORT_LABELS[s]}
        </option>
      ))}
    </select>
  );
}
