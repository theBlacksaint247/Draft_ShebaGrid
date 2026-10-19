"use client";

import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";
import { CityMapLazy } from "@/components/map/CityMapLazy";
import { RISK_LABEL, RiskRing } from "@/components/marks";
import { StatusChip } from "@/components/StatusChip";
import { CATEGORY_LABEL, formatDistance } from "@/lib/format";
import { HIGH_RISK_FROM, MEDIUM_RISK_FROM, RISK_WEIGHTS } from "@/lib/hotspots";
import { PLACES } from "@/lib/places";
import { useComplaints, useHotspots } from "@/lib/store/hooks";
import { isClosed } from "@/lib/sla";
import type { Complaint, Corporation, Hotspot, LatLng, RiskFactors } from "@/lib/types";

type View = "both" | Corporation;

const VIEWS: { value: View; label: string; center: LatLng; zoom: number }[] = [
  { value: "both", label: "Both", center: { lat: 23.79, lng: 90.4 }, zoom: 11.5 },
  { value: "DNCC", label: "DNCC", center: { lat: 23.828, lng: 90.395 }, zoom: 12 },
  { value: "DSCC", label: "DSCC", center: { lat: 23.728, lng: 90.405 }, zoom: 12 },
];

const FACTOR_LABEL: Record<keyof RiskFactors, string> = {
  frequency: "How often it is reported",
  recurrence: "Came back after a repair",
  severity: "How dangerous the hazard is",
  urgency: "Urgency of the reports",
  proximity: "Near a school, hospital or main road",
};

const PLACE_LABEL = {
  school: "School",
  hospital: "Hospital",
  "major-road": "Main road",
} as const;

function subscribeToHash(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
}

const inView = (view: View, corporation: Corporation) => view === "both" || corporation === view;

export function HotspotExplorer() {
  const hotspots = useHotspots();
  const complaints = useComplaints();

  // A link such as /hotspots#SG-0014 opens with that hotspot selected. The older
  // /hotspots#H-03 form still works.
  const hash = useSyncExternalStore(
    subscribeToHash,
    () => decodeURIComponent(window.location.hash.slice(1)),
    () => "",
  );
  const fromHash = hotspots.find((h) => h.key === hash || h.id === hash);
  const [chosenView, setChosenView] = useState<View | null>(null);
  const [chosenKey, setChosenKey] = useState<string | null>(null);

  const view: View = chosenView ?? "both";
  const visible = useMemo(() => hotspots.filter((h) => inView(view, h.corporation)), [hotspots, view]);
  const selected =
    hotspots.find((h) => h.key === (chosenKey ?? fromHash?.key)) ?? visible[0] ?? null;
  const selectedKey = selected?.key ?? null;

  const current = VIEWS.find((v) => v.value === view) ?? VIEWS[0];
  const points = useMemo(
    () =>
      complaints
        .filter((c) => inView(view, c.corporation))
        .map((c) => ({
          id: c.id,
          lat: c.lat,
          lng: c.lng,
          label: `${c.id}: ${c.title}`,
          muted: isClosed(c.status),
        })),
    [complaints, view],
  );

  function chooseView(next: View) {
    setChosenView(next);
    setChosenKey(hotspots.find((h) => inView(next, h.corporation))?.key ?? "");
  }

  return (
    <div>
      <div role="group" aria-label="Choose an area" className="flex flex-wrap gap-2">
        {VIEWS.map((v) => (
          <button
            key={v.value}
            type="button"
            aria-pressed={view === v.value}
            onClick={() => chooseView(v.value)}
            className={`rounded-full border-2 px-4 py-1.5 font-semibold ${
              view === v.value
                ? "border-ink bg-ink text-paper"
                : "border-line bg-panel hover:border-ink/50"
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div>
          <div className="h-[28rem] overflow-hidden rounded-ui border border-line lg:h-[34rem]">
            <CityMapLazy
              center={current.center}
              zoom={current.zoom}
              label="Map of hotspots. Rings mark places with repeated reports."
              className="h-full w-full"
              points={points}
              hotspots={visible}
              selectedHotspotId={selectedKey}
              onSelectHotspot={setChosenKey}
              places={PLACES}
              scrollZoom
            />
          </div>
          <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted" aria-label="Map key">
            {(["high", "medium", "low"] as const).map((level) => (
              <li key={level} className="flex items-center gap-1.5">
                <RiskRing level={level} size={18} />
                {RISK_LABEL[level]} (
                {level === "high"
                  ? `${HIGH_RISK_FROM * 100}+`
                  : level === "medium"
                    ? `${MEDIUM_RISK_FROM * 100} to ${HIGH_RISK_FROM * 100 - 1}`
                    : `under ${MEDIUM_RISK_FROM * 100}`}
                )
              </li>
            ))}
            <li className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full border border-panel bg-ink" />
              One report
            </li>
            <li className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full border border-panel bg-ink opacity-30" />
              Fixed
            </li>
            <li className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rotate-45 border border-panel bg-brand-ink" />
              School, hospital or main road
            </li>
          </ul>
        </div>

        <ol aria-label="Hotspots ranked by risk" className="divide-y divide-line self-start border-y border-line">
          {visible.map((h, i) => (
            <li key={h.key} id={h.key}>
              <button
                type="button"
                onClick={() => setChosenKey(h.key)}
                aria-current={h.key === selectedKey ? "true" : undefined}
                className={`flex w-full items-center gap-3 px-3 py-3 text-left ${
                  h.key === selectedKey ? "bg-brand-soft" : "hover:bg-wash"
                }`}
              >
                <span className="w-5 text-sm tabular-nums text-muted">{i + 1}</span>
                <RiskRing level={h.level} size={24} />
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">
                    {h.area}, {h.corporation}
                  </span>
                  <span className="block text-sm text-muted">
                    {CATEGORY_LABEL[h.category]}, {h.count} reports
                  </span>
                </span>
                <span className="text-right">
                  <span className="block font-display text-2xl font-bold tabular-nums">
                    {Math.round(h.score * 100)}
                  </span>
                  <span className="block text-sm text-muted">{RISK_LABEL[h.level]}</span>
                </span>
              </button>
            </li>
          ))}
          {visible.length === 0 && <li className="px-3 py-6 text-muted">No hotspots yet.</li>}
        </ol>
      </div>

      {selected && <HotspotDetail hotspot={selected} complaints={complaints} />}
    </div>
  );
}

function HotspotDetail({ hotspot, complaints }: { hotspot: Hotspot; complaints: Complaint[] }) {
  const members = useMemo(() => {
    const ids = new Set(hotspot.complaintIds);
    return complaints
      .filter((c) => ids.has(c.id))
      .sort((a, b) => Date.parse(b.reportedAt) - Date.parse(a.reportedAt));
  }, [hotspot, complaints]);
  const stillOpen = members.filter((c) => !isClosed(c.status)).length;

  return (
    <section aria-labelledby="hotspot-title" className="mt-10 border-t-[3px] border-ink pt-6">
      <div className="flex flex-wrap items-center gap-3">
        <RiskRing level={hotspot.level} size={34} />
        <h2 id="hotspot-title" className="text-3xl font-bold">
          {hotspot.area}, Ward {hotspot.ward}, {hotspot.corporation}
        </h2>
      </div>
      <p className="mt-2 max-w-prose text-lg text-muted">
        {hotspot.count} {CATEGORY_LABEL[hotspot.category].toLowerCase()} reports within{" "}
        {Math.round(hotspot.radiusM + 0.5)} m of each other, {stillOpen} still open. Location Risk
        Index{" "}
        <span className="font-semibold tabular-nums text-ink">{Math.round(hotspot.score * 100)} out of 100</span>
        , {RISK_LABEL[hotspot.level].toLowerCase()}.
      </p>

      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        <div>
          <h3 className="text-xl font-bold">Why it scores this way</h3>
          <ul className="mt-3 space-y-3">
            {(Object.keys(RISK_WEIGHTS) as (keyof RiskFactors)[]).map((key) => {
              const value = Math.min(1, hotspot.factors[key]);
              return (
                <li key={key}>
                  <div className="flex justify-between gap-4">
                    <span>{FACTOR_LABEL[key]}</span>
                    <span className="tabular-nums text-muted">
                      {Math.round(value * 100)}%, weight {Math.round(RISK_WEIGHTS[key] * 100)}%
                    </span>
                  </div>
                  <div
                    role="meter"
                    aria-label={FACTOR_LABEL[key]}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(value * 100)}
                    className="mt-1 h-2.5 rounded-full bg-line"
                  >
                    <div
                      className="h-full rounded-full bg-ink transition-[width] duration-500"
                      style={{ width: `${value * 100}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div>
          <h3 className="text-xl font-bold">Close by</h3>
          {hotspot.nearby.length > 0 ? (
            <ul className="mt-2 divide-y divide-line border-y border-line">
              {hotspot.nearby.map((n) => (
                <li key={n.name} className="flex justify-between gap-4 py-2">
                  <span>
                    {n.name} <span className="text-muted">({PLACE_LABEL[n.kind].toLowerCase()})</span>
                  </span>
                  <span className="tabular-nums text-muted">{formatDistance(n.distance)} away</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-muted">None within reach.</p>
          )}

          <h3 className="mt-6 text-xl font-bold">Reports in this hotspot</h3>
          <ul className="mt-2 divide-y divide-line border-y border-line">
            {members.slice(0, 6).map((c) => (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 py-2">
                <span>
                  <Link href={`/complaints/${c.id}`} className="plate text-ink hover:bg-wash">
                    {c.id}
                  </Link>{" "}
                  {c.title}
                </span>
                <StatusChip status={c.status} />
              </li>
            ))}
          </ul>
          {members.length > 6 && <p className="mt-2 text-sm text-muted">and {members.length - 6} more.</p>}
        </div>
      </div>
    </section>
  );
}
