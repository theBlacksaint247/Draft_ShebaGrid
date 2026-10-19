import type { Complaint, Status, Urgency } from "./types";

/** Hours a ward engineer has to resolve a complaint, by urgency. */
const SLA_HOURS: Record<Urgency, number> = {
  5: 24,
  4: 48,
  3: 72,
  2: 120,
  1: 168,
};

const HOUR_MS = 3_600_000;

export function slaHours(urgency: Urgency): number {
  return SLA_HOURS[urgency];
}

export function dueDate(reportedAt: string, urgency: Urgency): string {
  return new Date(Date.parse(reportedAt) + slaHours(urgency) * HOUR_MS).toISOString();
}

const CLOSED: Status[] = ["resolved", "verified"];

export function isClosed(status: Status): boolean {
  return CLOSED.includes(status);
}

export interface TimeLeft {
  overdue: boolean;
  hours: number;
}

export function timeLeft(dueAt: string, now: string): TimeLeft {
  const diffHours = (Date.parse(dueAt) - Date.parse(now)) / HOUR_MS;
  return { overdue: diffHours < 0, hours: Math.abs(diffHours) };
}

/** "2 d 4 h left", "5 h 12 m left", "24 m left", "1 d 3 h overdue". */
export function formatTimeLeft({ overdue, hours }: TimeLeft): string {
  // The small extra keeps 5 h from turning into 4 h 59 m through rounding.
  const minutes = Math.floor(hours * 60 + 1e-6);
  const days = Math.floor(minutes / 1440);
  const h = Math.floor((minutes % 1440) / 60);
  const m = minutes % 60;
  const text =
    days > 0
      ? `${days} d ${h} h`
      : h > 0
        ? m > 0
          ? `${h} h ${m} m`
          : `${h} h`
        : minutes > 0
          ? `${m} m`
          : "under 1 m";
  return `${text} ${overdue ? "overdue" : "left"}`;
}

export function isOverdue(complaint: Complaint, now: string): boolean {
  return !isClosed(complaint.status) && timeLeft(complaint.dueAt, now).overdue;
}

/** The step that follows a status in the ticket lifecycle, or null at the end. */
export function nextStatus(status: Status): Status | null {
  switch (status) {
    case "open":
      return "assigned";
    case "assigned":
      return "in-progress";
    case "escalated":
      return "in-progress";
    case "in-progress":
      return "resolved";
    case "resolved":
      return "verified";
    case "verified":
      return null;
  }
}

export const STATUS_LABEL: Record<Status, string> = {
  open: "Open",
  assigned: "Assigned",
  "in-progress": "In progress",
  resolved: "Resolved",
  verified: "Verified",
  escalated: "Escalated",
};

/** Button text for moving a ticket to its next status. */
export const STATUS_ACTION: Record<Status, string | null> = {
  open: "Assign engineer",
  assigned: "Start work",
  escalated: "Take over",
  "in-progress": "Mark resolved",
  resolved: "Verify",
  verified: null,
};
