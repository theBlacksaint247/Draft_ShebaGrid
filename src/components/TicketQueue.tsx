"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { StatusChip } from "@/components/StatusChip";
import { Deadline } from "@/components/ui/Deadline";
import { UrgencyMeter } from "@/components/UrgencyMeter";
import { CATEGORY_LABEL } from "@/lib/format";
import { CORPORATIONS } from "@/lib/names";
import { PERSONAS } from "@/lib/people";
import { actionFor, compareByPriority } from "@/lib/queue";
import { isClosed, isOverdue } from "@/lib/sla";
import { moveTicket } from "@/lib/store/demo";
import { useComplaints, useFresh, useNowIso } from "@/lib/store/hooks";
import type { Complaint, Corporation, Role } from "@/lib/types";

type View = "mine" | "open" | "late" | "fixed";

const PAGE = 12;

const control = "rounded-ui border border-ink/40 bg-panel px-3 py-2";

interface Props {
  role: Role;
  corporation: Corporation | "all";
  onCorporationChange: (value: Corporation | "all") => void;
}

export function TicketQueue({ role, corporation, onCorporationChange }: Props) {
  const persona = PERSONAS[role];
  const complaints = useComplaints();
  const fresh = useFresh();
  const now = useNowIso();

  const [view, setView] = useState<View>("mine");
  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(PAGE);

  const inScope = useMemo(
    () =>
      complaints.filter((c) => {
        if (corporation !== "all" && c.corporation !== corporation) return false;
        const q = search.trim().toLowerCase();
        return (
          q === "" ||
          `${c.id} ${c.title} ${c.area} ${CATEGORY_LABEL[c.category]} ${c.assignee ?? ""}`
            .toLowerCase()
            .includes(q)
        );
      }),
    [complaints, corporation, search],
  );

  const matches = (v: View, c: (typeof complaints)[number]) =>
    v === "mine"
      ? actionFor(role, c.status) !== null
      : v === "open"
        ? !isClosed(c.status)
        : v === "late"
          ? isOverdue(c, now)
          : isClosed(c.status);

  const rows = useMemo(
    () => {
      const byPriority = compareByPriority(now);
      // An official's first job is to check finished repairs, so those come first.
      const verifyFirst = (a: Complaint, b: Complaint) =>
        view === "mine" && role === "official"
          ? Number(b.status === "resolved") - Number(a.status === "resolved") || byPriority(a, b)
          : byPriority(a, b);
      return inScope.filter((c) => matches(view, c)).sort(verifyFirst);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [inScope, view, now, role],
  );

  const VIEWS: { value: View; label: string }[] = [
    { value: "mine", label: "Needs my action" },
    { value: "open", label: "All open" },
    { value: "late", label: "Past deadline" },
    { value: "fixed", label: "Fixed" },
  ];

  return (
    <section aria-labelledby="queue-title">
      <h2 id="queue-title" className="sr-only">Tickets</h2>

      <div role="tablist" aria-label="Which tickets to show" className="flex flex-wrap gap-1 border-b border-line">
        {VIEWS.map(({ value, label }) => (
          <button
            key={value}
            role="tab"
            type="button"
            aria-selected={view === value}
            onClick={() => {
              setView(value);
              setLimit(PAGE);
            }}
            className={`-mb-px border-b-[3px] px-3 py-2 font-medium ${
              view === value ? "border-signal text-ink" : "border-transparent text-muted hover:text-ink"
            }`}
          >
            {label}{" "}
            <span className="tabular-nums text-muted">({inScope.filter((c) => matches(value, c)).length})</span>
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="q-search" className="block text-sm font-semibold">Search</label>
          <input
            id="q-search"
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setLimit(PAGE);
            }}
            placeholder="Ticket, area or engineer"
            className={`${control} mt-0.5 w-56`}
          />
        </div>
        <div>
          <label htmlFor="q-corp" className="block text-sm font-semibold">City corporation</label>
          <select
            id="q-corp"
            className={`${control} mt-0.5`}
            value={corporation}
            onChange={(e) => {
              onCorporationChange(e.target.value as Corporation | "all");
              setLimit(PAGE);
            }}
          >
            <option value="all">Both</option>
            {CORPORATIONS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <p className="ml-auto text-sm tabular-nums text-muted">
          {Math.min(limit, rows.length)} of {rows.length} shown
        </p>
      </div>

      <ul className="mt-3 divide-y divide-line border-y border-line">
        {rows.slice(0, limit).map((c) => {
          const action = actionFor(role, c.status);
          const late = isOverdue(c, now);
          return (
            <li
              key={c.id}
              className={`grid items-center gap-x-4 gap-y-2 px-2 py-3.5 md:grid-cols-[5.5rem_1fr_8.5rem_auto] ${
                fresh.includes(c.id) ? "row-new" : ""
              }`}
            >
              <div className="flex items-center justify-between gap-3 md:block">
                <UrgencyMeter value={c.urgency} />
                <p className={`text-sm md:mt-1 ${late ? "font-semibold text-signal-ink" : "text-muted"}`}>
                  <Deadline complaint={c} />
                </p>
              </div>
              <div className="min-w-0">
                <Link
                  href={`/complaints/${c.id}`}
                  className="font-semibold underline-offset-2 hover:underline"
                >
                  {c.title}
                </Link>
                <p className="flex flex-wrap items-center gap-x-2 text-sm text-muted">
                  <span className="plate text-ink">{c.id}</span>
                  {CATEGORY_LABEL[c.category]} in {c.area}, Ward {c.ward}, {c.corporation}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 md:block">
                <StatusChip status={c.status} />
                <p className="text-sm text-muted md:mt-1">{c.assignee ?? "Not assigned"}</p>
              </div>
              <div className="md:text-right">
                {action && (
                  <button
                    type="button"
                    onClick={() => moveTicket(c.id, { role, name: persona.name })}
                    className="w-full whitespace-nowrap rounded-ui border-2 border-brand-ink px-3 py-1.5 font-semibold text-brand-ink hover:bg-brand hover:text-white md:w-auto"
                  >
                    {action}
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      {rows.length === 0 && (
        <p className="py-10 text-muted">
          {complaints.length === 0
            ? "No complaints have been filed yet."
            : view === "mine"
              ? "Nothing needs your action."
              : "No tickets match."}
        </p>
      )}
      {rows.length > limit && (
        <button
          type="button"
          onClick={() => setLimit((n) => n + PAGE)}
          className="mt-4 rounded-ui border-2 border-ink px-4 py-2 font-semibold hover:bg-ink hover:text-paper"
        >
          Show {Math.min(PAGE, rows.length - limit)} more
        </button>
      )}
    </section>
  );
}
