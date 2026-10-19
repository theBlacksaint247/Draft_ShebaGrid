import type { Metadata } from "next";
import { HotspotExplorer } from "@/components/HotspotExplorer";
import { RoleGate } from "@/components/shell/RoleGate";
import { OFFICERS } from "@/lib/people";

export const metadata: Metadata = {
  title: "Hotspots",
};

export default function HotspotsPage() {
  return (
    <RoleGate allow={OFFICERS} subject="the hotspot map">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <h1 className="text-4xl font-bold sm:text-5xl">Hotspots</h1>
        <div className="mt-6">
          <HotspotExplorer />
        </div>
      </div>
    </RoleGate>
  );
}
