"use client";

import { RISK_LABEL, RiskRing } from "@/components/marks";
import { Counter } from "@/components/ui/Counter";
import { CATEGORY_LABEL } from "@/lib/format";
import { useHotspots } from "@/lib/store/hooks";

/** The highest-risk hotspots, ranked by Location Risk Index. */
export function HotspotWatch({ limit = 5 }: { limit?: number }) {
  const hotspots = useHotspots().slice(0, limit);

  if (hotspots.length === 0) {
    return <p className="border-y border-line py-6 text-muted">No hotspots yet.</p>;
  }

  return (
    <ol className="divide-y divide-line border-y border-line">
      {hotspots.map((spot, i) => (
        <li key={spot.key} className="flex items-center gap-4 py-3.5">
          <span className="w-4 text-sm tabular-nums text-muted">{i + 1}</span>
          <RiskRing level={spot.level} size={28} />
          <div className="min-w-0 flex-1">
            <p className="font-semibold">
              {spot.area}, {spot.corporation}
            </p>
            <p className="text-sm text-muted">
              {CATEGORY_LABEL[spot.category]}, {spot.count} reports
            </p>
          </div>
          <div className="text-right">
            <p className="font-display text-2xl font-bold">
              <Counter value={Math.round(spot.score * 100)} />
            </p>
            <p className="text-sm text-muted">{RISK_LABEL[spot.level]}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
