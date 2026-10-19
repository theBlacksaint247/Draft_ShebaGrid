import { isClosed } from "./sla";
import type { Complaint, Corporation } from "./types";

const DAY_MS = 24 * 3_600_000;
const WEEK_MS = 7 * DAY_MS;

export interface CorporationStats {
  open: number;
  fixedThisWeek: number;
  /** Share of closed tickets that were fixed before their deadline, or null if none are closed. */
  onTimePercent: number | null;
  /** Reports received in each of the last 14 days, oldest first. */
  perDay: number[];
}

/** The numbers shown for each city corporation on the home page. */
export function corporationStats(
  complaints: Complaint[],
  corporation: Corporation,
  now: string,
): CorporationStats {
  const nowMs = Date.parse(now);
  const own = complaints.filter((c) => c.corporation === corporation);
  const closed = own.filter((c) => isClosed(c.status));

  const onTime = closed.filter((c) => {
    const fixedAt = c.history.find((e) => e.status === "resolved")?.at ?? c.updatedAt;
    return Date.parse(fixedAt) <= Date.parse(c.dueAt);
  });

  const perDay = Array.from({ length: 14 }, (_, i) => {
    const end = nowMs - (13 - i) * DAY_MS;
    const start = end - DAY_MS;
    return own.filter((c) => {
      const at = Date.parse(c.reportedAt);
      return at > start && at <= end;
    }).length;
  });

  return {
    open: own.length - closed.length,
    fixedThisWeek: closed.filter((c) => nowMs - Date.parse(c.updatedAt) <= WEEK_MS).length,
    onTimePercent: closed.length === 0 ? null : Math.round((onTime.length / closed.length) * 100),
    perDay,
  };
}
