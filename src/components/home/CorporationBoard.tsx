"use client";

import { Counter } from "@/components/ui/Counter";
import { CORPORATIONS, CORPORATION_NAME } from "@/lib/names";
import { corporationStats } from "@/lib/stats";
import { useComplaints, useHotspots, useNowIso } from "@/lib/store/hooks";

function Sparkline({ values, label }: { values: number[]; label: string }) {
  const peak = Math.max(1, ...values);
  return (
    <div role="img" aria-label={label} className="flex h-10 items-end gap-[3px]">
      {values.map((v, i) => (
        <span
          key={i}
          style={{ height: `${Math.max(8, (v / peak) * 100)}%` }}
          className={`w-full rounded-[1px] ${
            v === 0 ? "bg-line" : i === values.length - 1 ? "bg-signal" : "bg-brand-ink/60"
          }`}
        />
      ))}
    </div>
  );
}

/** How each city corporation is doing, from the same data as the map. */
export function CorporationBoard() {
  const complaints = useComplaints();
  const hotspots = useHotspots();
  const now = useNowIso();

  return (
    <ul className="space-y-4">
      {CORPORATIONS.map((corporation) => {
        const stats = corporationStats(complaints, corporation, now);
        const spots = hotspots.filter((h) => h.corporation === corporation).length;
        return (
          <li key={corporation} className="rounded-ui border border-line bg-panel p-4">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="text-xl font-bold">{corporation}</h3>
              <p className="text-sm text-muted">{CORPORATION_NAME[corporation]}</p>
            </div>
            <dl className="mt-3 grid grid-cols-4 gap-3">
              <div>
                <dd className="font-display text-2xl font-bold"><Counter value={stats.open} /></dd>
                <dt className="text-sm text-muted">Open</dt>
              </div>
              <div>
                <dd className="font-display text-2xl font-bold"><Counter value={spots} /></dd>
                <dt className="text-sm text-muted">Hotspots</dt>
              </div>
              <div>
                <dd className="font-display text-2xl font-bold"><Counter value={stats.fixedThisWeek} /></dd>
                <dt className="text-sm text-muted">Fixed, 7 days</dt>
              </div>
              <div>
                <dd className="font-display text-2xl font-bold">
                  {stats.onTimePercent === null ? "–" : <><Counter value={stats.onTimePercent} />%</>}
                </dd>
                <dt className="text-sm text-muted">On time</dt>
              </div>
            </dl>
            <div className="mt-3">
              <Sparkline
                values={stats.perDay}
                label={`New reports per day in ${corporation} over the last 14 days: ${stats.perDay.join(", ")}`}
              />
              <p className="mt-1 text-sm text-muted">New reports per day, last 14 days</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
