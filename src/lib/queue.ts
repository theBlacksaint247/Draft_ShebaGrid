import { wardEngineer } from "./people";
import { STATUS_ACTION, isClosed, isFixedThisWeek, isOverdue, nextStatus, timeLeft } from "./sla";
import type { Complaint, Role, Status } from "./types";

/**
 * Orders the officer's queue: open work before closed work, overdue first
 * (the most overdue at the top), then the most urgent, then the soonest due.
 */
export function compareByPriority(now: string) {
  return (a: Complaint, b: Complaint): number => {
    const closed = Number(isClosed(a.status)) - Number(isClosed(b.status));
    if (closed !== 0) return closed;

    const overdue = Number(isOverdue(b, now)) - Number(isOverdue(a, now));
    if (overdue !== 0) return overdue;

    if (isOverdue(a, now) && isOverdue(b, now)) {
      const late = timeLeft(b.dueAt, now).hours - timeLeft(a.dueAt, now).hours;
      if (late !== 0) return late;
    }

    if (a.urgency !== b.urgency) return b.urgency - a.urgency;
    return Date.parse(a.dueAt) - Date.parse(b.dueAt);
  };
}

export function summarize(complaints: Complaint[], now: string) {
  const open = complaints.filter((c) => !isClosed(c.status));
  return {
    open: open.length,
    overdue: open.filter((c) => isOverdue(c, now)).length,
    escalated: complaints.filter((c) => c.status === "escalated").length,
    fixedThisWeek: complaints.filter((c) => isFixedThisWeek(c, Date.parse(now))).length,
  };
}

/** Move a complaint to its next status and record when it happened. */
export function advance(
  complaint: Complaint,
  now: string,
  engineer = "You",
): Complaint {
  const status = nextStatus(complaint.status);
  if (!status) return complaint;
  return {
    ...complaint,
    status,
    updatedAt: now,
    // An escalated ticket moves to whoever takes it over.
    assignee:
      complaint.status === "escalated" ? engineer : (complaint.assignee ?? engineer),
    history: [...complaint.history, { status, at: now }],
  };
}

/** Who may move a ticket on from each status. */
const MAY_ADVANCE: Record<Status, Role[]> = {
  open: ["engineer", "senior", "official"],
  assigned: ["engineer", "senior"],
  "in-progress": ["engineer", "senior"],
  escalated: ["senior"],
  resolved: ["official"],
  verified: [],
};

/** The button text for the step this role may take, or null if they may not. */
export function actionFor(role: Role | null, status: Status): string | null {
  if (!role || !MAY_ADVANCE[status].includes(role)) return null;
  if (status === "open" && role !== "official") return "Assign to me";
  return STATUS_ACTION[status];
}

/** The name recorded when this person moves a ticket forward. */
export function actorFor(role: Role, name: string, complaint: Complaint): string {
  return role === "official" ? wardEngineer(complaint.corporation, complaint.ward) : name;
}

/** Assigned or in-progress tickets that have passed their deadline. */
export function needsEscalation(complaint: Complaint, now: string): boolean {
  return (
    (complaint.status === "assigned" || complaint.status === "in-progress") &&
    isOverdue(complaint, now)
  );
}

/**
 * The escalation engine: every ticket that is being worked on and has missed its
 * deadline moves to "escalated", stamped with the moment the deadline passed.
 * Returns the same array when nothing changed.
 */
export function escalateOverdue(
  complaints: Complaint[],
  now: string,
): { complaints: Complaint[]; escalated: Complaint[] } {
  const escalated: Complaint[] = [];
  const next = complaints.map((c) => {
    if (!needsEscalation(c, now)) return c;
    const lastEvent = c.history[c.history.length - 1]?.at ?? c.dueAt;
    const at = Date.parse(c.dueAt) > Date.parse(lastEvent) ? c.dueAt : lastEvent;
    const moved: Complaint = {
      ...c,
      status: "escalated",
      updatedAt: at,
      history: [...c.history, { status: "escalated", at }],
    };
    escalated.push(moved);
    return moved;
  });
  return { complaints: escalated.length > 0 ? next : complaints, escalated };
}
