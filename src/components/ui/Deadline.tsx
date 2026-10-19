"use client";

import { useNowIso } from "@/lib/store/hooks";
import { formatTimeLeft, isClosed, timeLeft } from "@/lib/sla";
import type { Complaint } from "@/lib/types";

/** Time left or overdue, counting along with the demo clock. */
export function Deadline({ complaint, className = "" }: { complaint: Complaint; className?: string }) {
  const now = useNowIso();
  if (isClosed(complaint.status)) {
    return <span className={`text-muted ${className}`}>Closed</span>;
  }
  const left = timeLeft(complaint.dueAt, now);
  return (
    <span className={`tabular-nums ${left.overdue ? "font-semibold text-signal-ink" : ""} ${className}`}>
      {formatTimeLeft(left)}
    </span>
  );
}
