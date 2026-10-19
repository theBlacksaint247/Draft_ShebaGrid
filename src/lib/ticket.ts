import { CATEGORY_LABEL } from "./format";
import { distanceMeters, nearestZone } from "./geo";
import { ZONES } from "./places";
import { dueDate, isClosed } from "./sla";
import type { Category, Complaint, LatLng, Urgency } from "./types";

/** A spot where a repair was marked done counts as "came back" within this distance. */
const REPEAT_RADIUS_M = 30;

export function nextComplaintId(complaints: Complaint[]): string {
  const highest = complaints.reduce(
    (max, c) => Math.max(max, Number(c.id.slice(3))),
    0,
  );
  return `SG-${String(highest + 1).padStart(4, "0")}`;
}

export interface NewComplaint extends LatLng {
  category: Category;
  description: string;
  urgency: Urgency;
  /** Defaults to "Category near Area". */
  title?: string;
  mine?: boolean;
  aiLabel?: { category: Category; confidence: number };
  photo?: string;
}

/** Build a new open ticket: matched to its ward, with a deadline from its urgency. */
export function createComplaint(
  input: NewComplaint,
  existing: Complaint[],
  now: string,
): Complaint {
  const zone = nearestZone(input, ZONES);
  const cameBack = existing.some(
    (c) => isClosed(c.status) && distanceMeters(c, input) <= REPEAT_RADIUS_M,
  );
  return {
    id: nextComplaintId(existing),
    category: input.category,
    title: input.title ?? `${CATEGORY_LABEL[input.category]} near ${zone.name}`,
    description: input.description,
    lat: input.lat,
    lng: input.lng,
    zoneId: zone.id,
    area: zone.name,
    corporation: zone.corporation,
    ward: zone.ward,
    status: "open",
    urgency: input.urgency,
    reportedAt: now,
    updatedAt: now,
    dueAt: dueDate(now, input.urgency),
    assignee: null,
    ...(input.aiLabel ? { aiLabel: input.aiLabel } : {}),
    ...(input.photo ? { photo: input.photo } : {}),
    repeatAfterRepair: cameBack,
    mine: input.mine ?? false,
    history: [{ status: "open", at: now }],
  };
}
