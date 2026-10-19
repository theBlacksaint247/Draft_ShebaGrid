export type Corporation = "DNCC" | "DSCC";

export type Category = "pothole" | "waterlogging" | "open-manhole" | "other";

export type Status =
  | "open"
  | "assigned"
  | "in-progress"
  | "resolved"
  | "verified"
  | "escalated";

export type Urgency = 1 | 2 | 3 | 4 | 5;

export type RiskLevel = "high" | "medium" | "low";

export interface LatLng {
  lat: number;
  lng: number;
}

/** An area of a city corporation. Centres and ward numbers are approximate. */
export interface Zone extends LatLng {
  id: string;
  name: string;
  corporation: Corporation;
  ward: number;
}

export type PlaceKind = "school" | "hospital" | "major-road";

export interface Place extends LatLng {
  id: string;
  name: string;
  kind: PlaceKind;
}

export interface StatusEvent {
  status: Status;
  at: string;
}

export interface Complaint extends LatLng {
  id: string;
  category: Category;
  title: string;
  description: string;
  zoneId: string;
  area: string;
  corporation: Corporation;
  ward: number;
  status: Status;
  urgency: Urgency;
  reportedAt: string;
  updatedAt: string;
  dueAt: string;
  assignee: string | null;
  /** What the photo check said about the picture. Missing when there was no photo. */
  aiLabel?: { category: Category; confidence: number };
  /** The resident's photo, shrunk to fit in the browser. */
  photo?: string;
  /** The same spot was reported again after a repair was marked done. */
  repeatAfterRepair: boolean;
  /** True for complaints filed from this browser's resident account. */
  mine: boolean;
  history: StatusEvent[];
}

export interface RiskFactors {
  frequency: number;
  recurrence: number;
  severity: number;
  urgency: number;
  proximity: number;
}

export interface NearbyPlace {
  kind: PlaceKind;
  name: string;
  distance: number;
}

export interface Hotspot extends LatLng {
  id: string;
  /** The earliest complaint in the group. Stays the same while the hotspot's rank changes. */
  key: string;
  complaintIds: string[];
  count: number;
  category: Category;
  area: string;
  corporation: Corporation;
  ward: number;
  radiusM: number;
  factors: RiskFactors;
  score: number;
  level: RiskLevel;
  nearby: NearbyPlace[];
}

/** The four kinds of people who use Shebagrid. */
export type Role = "resident" | "engineer" | "senior" | "official";

/** A demo account for the prototype's sign-in. */
export interface Persona {
  role: Role;
  name: string;
  initials: string;
  title: string;
  corporation: Corporation;
}
