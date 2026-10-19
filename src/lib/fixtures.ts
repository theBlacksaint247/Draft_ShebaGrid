import { offsetMeters } from "./geo";
import { dueDate } from "./sla";
import type { Category, Complaint, LatLng, Status, Urgency } from "./types";

/** A fixed moment for the tests, so they do not depend on the clock. */
export const NOW = "2026-10-19T06:00:00.000Z";

export const HOUR = 3_600_000;

/** Mirpur-10 circle, used as a starting point. */
export const MIRPUR: LatLng = { lat: 23.8069, lng: 90.3687 };

const ORDER: Status[] = ["open", "assigned", "in-progress", "resolved", "verified"];

/** An hour after `iso`. */
export const later = (iso: string, hours: number) => new Date(Date.parse(iso) + hours * HOUR).toISOString();

interface Options {
  id?: string;
  at?: LatLng;
  category?: Category;
  urgency?: Urgency;
  /** When it was reported. Defaults to six hours before NOW. */
  reportedAt?: string;
  repeatAfterRepair?: boolean;
  mine?: boolean;
  assignee?: string | null;
}

/**
 * A complaint that has moved through every stage up to `status`, one hour apart.
 * "escalated" is built as a ticket that was assigned and then missed its deadline.
 */
export function complaint(status: Status = "open", options: Options = {}): Complaint {
  const at = options.at ?? MIRPUR;
  const urgency = options.urgency ?? 3;
  const reportedAt = options.reportedAt ?? later(NOW, -6);
  const path: Status[] =
    status === "escalated" ? ["open", "assigned", "escalated"] : ORDER.slice(0, ORDER.indexOf(status) + 1);
  const history = path.map((s, i) => ({ status: s, at: later(reportedAt, i) }));
  return {
    id: options.id ?? "SG-0001",
    category: options.category ?? "pothole",
    title: "Pothole near Mirpur-10",
    description: "A deep hole in the left lane",
    zoneId: "mirpur-10",
    area: "Mirpur-10",
    corporation: "DNCC",
    ward: 2,
    status,
    urgency,
    reportedAt,
    updatedAt: history[history.length - 1].at,
    dueAt: dueDate(reportedAt, urgency),
    assignee: options.assignee ?? (status === "open" ? null : "Engr. Test"),
    repeatAfterRepair: options.repeatAfterRepair ?? false,
    mine: options.mine ?? false,
    history,
    ...at,
  };
}

/** `count` open complaints a few metres apart, with ids from `first`. */
export function cluster(at: LatLng, count: number, first = 1, options: Options = {}): Complaint[] {
  return Array.from({ length: count }, (_, i) =>
    complaint("open", {
      ...options,
      id: `SG-${String(first + i).padStart(4, "0")}`,
      at: offsetMeters(at, (i % 3) * 8, Math.floor(i / 3) * 8),
    }),
  );
}
