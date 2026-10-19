import Link from "next/link";
import { CorporationBoard } from "@/components/home/CorporationBoard";
import { HotspotWatch } from "@/components/home/HotspotWatch";
import { MapHero } from "@/components/home/MapHero";
import { StatusMark } from "@/components/marks";
import { UrgencyMeter } from "@/components/UrgencyMeter";
import { slaHours } from "@/lib/sla";
import type { Status, Urgency } from "@/lib/types";

const JOURNEY: { status: Status; title: string; text: string }[] = [
  {
    status: "open",
    title: "You report it",
    text: "A photo, a pin and a few words.",
  },
  {
    status: "assigned",
    title: "An engineer is assigned",
    text: "The ward engineer gets the ticket, with a deadline.",
  },
  {
    status: "escalated",
    title: "Late tickets move up",
    text: "A senior engineer takes over when the deadline passes.",
  },
  {
    status: "verified",
    title: "An official checks the fix",
    text: "The ticket closes after the repair is verified.",
  },
];

const URGENCIES: Urgency[] = [5, 4, 3, 2, 1];

export default function Home() {
  return (
    <>
      <MapHero />

      <section className="mx-auto grid max-w-6xl gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <h2 className="text-3xl font-bold">Hotspots</h2>
          <div className="mt-6">
            <HotspotWatch />
          </div>
          <Link
            href="/hotspots"
            className="mt-5 inline-block font-semibold text-brand-ink underline underline-offset-4"
          >
            Open the hotspot map
          </Link>
        </div>
        <div>
          <h2 className="text-3xl font-bold">City corporations</h2>
          <div className="mt-6">
            <CorporationBoard />
          </div>
        </div>
      </section>

      <section id="how" className="border-y border-line bg-panel">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <h2 className="text-3xl font-bold">How it works</h2>
            <ol className="mt-6 space-y-5">
              {JOURNEY.map((step) => (
                <li key={step.title} className="flex gap-4">
                  <span className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-wash">
                    <StatusMark status={step.status} size={20} />
                  </span>
                  <div>
                    <h3 className="text-xl font-bold">{step.title}</h3>
                    <p className="text-muted">{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <div>
            <h2 className="text-3xl font-bold">Deadlines</h2>
            <table className="mt-5 w-full border-collapse text-left">
              <caption className="sr-only">Time to fix by urgency</caption>
              <thead>
                <tr className="border-b-2 border-ink text-sm">
                  <th scope="col" className="py-2 font-semibold">Urgency</th>
                  <th scope="col" className="py-2 text-right font-semibold">Fix within</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {URGENCIES.map((u) => (
                  <tr key={u}>
                    <td className="py-2.5"><UrgencyMeter value={u} /></td>
                    <td className="py-2.5 text-right font-semibold tabular-nums">
                      {slaHours(u) >= 48 ? `${slaHours(u) / 24} days` : `${slaHours(u)} hours`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </>
  );
}
