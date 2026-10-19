"use client";

import { useMemo } from "react";
import { CityMapLazy } from "@/components/map/CityMapLazy";
import { Counter } from "@/components/ui/Counter";
import { summarize } from "@/lib/queue";
import { isClosed } from "@/lib/sla";
import { useComplaints, useHotspots, useNowIso } from "@/lib/store/hooks";
import { HeroActions } from "./HeroActions";

const DHAKA = { lat: 23.79, lng: 90.4 };

/** The first thing on the home page: the map, with the headline over it. */
export function MapHero() {
  const complaints = useComplaints();
  const hotspots = useHotspots();
  const now = useNowIso();

  const points = useMemo(
    () =>
      complaints.map((c) => ({
        id: c.id,
        lat: c.lat,
        lng: c.lng,
        label: `${c.id}: ${c.title}`,
        muted: isClosed(c.status),
      })),
    [complaints],
  );

  const stats = summarize(complaints, now);
  const figures = [
    { label: "Open", value: stats.open },
    { label: "Fixed in 7 days", value: stats.fixedThisWeek },
    { label: "Hotspots", value: hotspots.length },
  ];

  return (
    <section aria-label="Map" className="relative isolate">
      <div className="h-[20rem] sm:h-[28rem] lg:h-[36rem]">
        <CityMapLazy
          center={DHAKA}
          zoom={11.5}
          label="Map of complaints and hotspots in Dhaka North and Dhaka South"
          className="h-full w-full"
          points={points}
          hotspots={hotspots}
        />
      </div>

      <div className="relative z-10 mx-auto -mt-6 max-w-6xl px-4 sm:px-6 lg:pointer-events-none lg:absolute lg:inset-0 lg:mt-0 lg:flex lg:items-center">
        <div className="pointer-events-auto rounded-ui bg-panel p-6 shadow-lift lg:w-[27rem] lg:p-7">
          <h1 className="text-balance text-4xl font-bold sm:text-5xl">
            Report a broken road. Watch it get fixed.
          </h1>
          <p lang="bn" className="mt-3 text-xl font-medium text-brand-ink">
            ভাঙা রাস্তার খবর দিন, সমাধানের অগ্রগতি দেখুন।
          </p>
          <HeroActions />
          <dl className="mt-6 grid grid-cols-3 gap-3 border-t border-line pt-4">
            {figures.map((f) => (
              <div key={f.label}>
                <dd className="font-display text-3xl font-bold">
                  <Counter value={f.value} />
                </dd>
                <dt className="text-sm text-muted">{f.label}</dt>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
