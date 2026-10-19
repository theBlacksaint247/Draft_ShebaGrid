"use client";

import Link from "next/link";
import { useState } from "react";
import { HotspotWatch } from "@/components/home/HotspotWatch";
import { TicketQueue } from "@/components/TicketQueue";
import { Counter } from "@/components/ui/Counter";
import { PERSONAS, ROLE_LABEL } from "@/lib/people";
import { summarize } from "@/lib/queue";
import { useComplaints, useNowIso, useSession } from "@/lib/store/hooks";
import type { Corporation, Role } from "@/lib/types";

export function DashboardView() {
  const { role } = useSession();
  // Starting again for each account, so switching accounts clears the filters.
  return role ? <Dashboard key={role} role={role} /> : null;
}

function Dashboard({ role }: { role: Role }) {
  const all = useComplaints();
  const now = useNowIso();
  const persona = PERSONAS[role];
  const [corporation, setCorporation] = useState<Corporation | "all">("all");

  const complaints = corporation === "all" ? all : all.filter((c) => c.corporation === corporation);
  const stats = summarize(complaints, now);
  const waiting = complaints.filter((c) => c.status === "open").length;
  const working = complaints.filter((c) => c.status === "assigned" || c.status === "in-progress").length;
  const unverified = complaints.filter((c) => c.status === "resolved").length;

  const figures = [
    { label: "Waiting for an engineer", value: waiting },
    { label: "Being worked on", value: working },
    { label: "Past their deadline", value: stats.overdue, alert: stats.overdue > 0 },
    { label: "Escalated", value: stats.escalated, alert: stats.escalated > 0 },
    { label: "Fixed, to verify", value: unverified },
    { label: "Fixed in 7 days", value: stats.fixedThisWeek },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <header>
        <h1 className="text-4xl font-bold sm:text-5xl">Dashboard</h1>
        <p className="mt-2 text-lg text-muted">
          {persona.name}, {ROLE_LABEL[role].toLowerCase()}
        </p>
      </header>

      <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {figures.map((f) => (
          <div
            key={f.label}
            className={`rounded-ui border-l-4 bg-panel px-3.5 py-3 shadow-lift ${
              f.alert ? "border-signal" : "border-line"
            }`}
          >
            <dd className={`font-display text-4xl font-bold ${f.alert ? "text-signal-ink" : ""}`}>
              <Counter value={f.value} />
            </dd>
            <dt className="text-sm leading-tight text-muted">{f.label}</dt>
          </div>
        ))}
      </dl>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_19rem]">
        <TicketQueue role={role} corporation={corporation} onCorporationChange={setCorporation} />
        <aside aria-label="Hotspots" className="lg:sticky lg:top-4 lg:self-start">
          <h2 className="text-xl font-bold">Hotspots</h2>
          <div className="mt-2">
            <HotspotWatch limit={3} />
          </div>
          <Link href="/hotspots" className="mt-3 inline-block font-semibold text-brand-ink underline underline-offset-4">
            Open the hotspot map
          </Link>
        </aside>
      </div>
    </div>
  );
}
