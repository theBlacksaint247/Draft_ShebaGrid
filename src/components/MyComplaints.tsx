"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ProgressStripe } from "@/components/ProgressStripe";
import { StatusChip } from "@/components/StatusChip";
import { Deadline } from "@/components/ui/Deadline";
import { CATEGORY_LABEL, formatDateTime } from "@/lib/format";
import { isClosed } from "@/lib/sla";
import { useComplaints, useFresh } from "@/lib/store/hooks";

type Filter = "all" | "active" | "closed";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Still open" },
  { value: "closed", label: "Fixed" },
];

const matches = (filter: Filter, closed: boolean) =>
  filter === "all" ? true : filter === "active" ? !closed : closed;

export function MyComplaints() {
  const all = useComplaints();
  const fresh = useFresh();
  const [filter, setFilter] = useState<Filter>("all");

  const mine = useMemo(
    () =>
      all
        .filter((c) => c.mine)
        .sort((a, b) => Date.parse(b.reportedAt) - Date.parse(a.reportedAt)),
    [all],
  );
  const shown = mine.filter((c) => matches(filter, isClosed(c.status)));

  return (
    <div>
      <div role="tablist" aria-label="Filter complaints" className="flex gap-1 border-b border-line">
        {FILTERS.map(({ value, label }) => (
          <button
            key={value}
            role="tab"
            type="button"
            aria-selected={filter === value}
            onClick={() => setFilter(value)}
            className={`-mb-px border-b-[3px] px-3 py-2 font-medium ${
              filter === value ? "border-signal text-ink" : "border-transparent text-muted hover:text-ink"
            }`}
          >
            {label}{" "}
            <span className="tabular-nums text-muted">
              ({mine.filter((c) => matches(value, isClosed(c.status))).length})
            </span>
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <p className="py-10 text-muted">
          Nothing here yet.{" "}
          <Link href="/report" className="font-semibold text-brand-ink underline underline-offset-2">
            Report a problem
          </Link>
        </p>
      ) : (
        <ul className="divide-y divide-line">
          {shown.map((c) => (
            <li key={c.id} className={fresh.includes(c.id) ? "row-new" : ""}>
              <Link
                href={`/complaints/${c.id}`}
                className="grid gap-x-6 gap-y-3 py-4 hover:bg-wash sm:grid-cols-[1fr_auto] sm:px-3"
              >
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-x-3 text-sm text-muted">
                    <span className="plate text-ink">{c.id}</span>
                    <span>Reported {formatDateTime(c.reportedAt)}</span>
                  </p>
                  <p className="mt-1 text-lg font-semibold">{c.title}</p>
                  <p className="text-muted">
                    {CATEGORY_LABEL[c.category]} in {c.area}, Ward {c.ward}, {c.corporation}
                  </p>
                  <div className="mt-3">
                    <ProgressStripe status={c.status} />
                  </div>
                </div>
                <div className="flex items-center gap-4 sm:flex-col sm:items-end sm:justify-center sm:gap-1">
                  <StatusChip status={c.status} />
                  <Deadline complaint={c} className="text-sm" />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
