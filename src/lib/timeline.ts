import type { Status, StatusEvent } from "./types";

const FLOW: Status[] = ["open", "assigned", "in-progress", "resolved", "verified"];

export interface TimelineRow {
  status: Status;
  /** When it happened, or undefined for a step still to come. */
  at?: string;
}

/**
 * What a ticket's progress list shows: every step that happened, in the order it
 * happened (an escalation sits where it occurred), then the steps still to come.
 */
export function timelineRows(history: StatusEvent[]): TimelineRow[] {
  const done: TimelineRow[] = history.map((e) => ({ status: e.status, at: e.at }));
  const last = history[history.length - 1]?.status ?? "open";
  // A ticket taken over after escalation goes back to in progress.
  const next = last === "escalated" ? FLOW.indexOf("in-progress") : FLOW.indexOf(last) + 1;
  return [...done, ...FLOW.slice(next).map((status) => ({ status }))];
}
