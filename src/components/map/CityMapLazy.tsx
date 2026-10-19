"use client";

import dynamic from "next/dynamic";

/** Leaflet needs the browser, so the map loads on the client only. */
export const CityMapLazy = dynamic(() => import("./CityMap"), {
  ssr: false,
  loading: () => (
    <div
      className="flex h-full min-h-72 w-full items-center justify-center bg-wash text-muted"
      role="status"
    >
      Loading map
    </div>
  ),
});
