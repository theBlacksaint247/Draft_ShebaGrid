import { centroid, distanceMeters } from "./geo";
import type {
  Category,
  Complaint,
  Hotspot,
  LatLng,
  NearbyPlace,
  Place,
  RiskFactors,
  RiskLevel,
} from "./types";

/** Complaints within this many metres of each other count as the same spot. */
export const HOTSPOT_RADIUS_M = 50;
/** A spot needs at least this many complaints to be a hotspot. */
export const HOTSPOT_MIN_REPORTS = 3;

export const NOISE = -1;

/**
 * Density-based clustering (DBSCAN) over geographic points.
 * Returns one label per point: 0, 1, 2 … for clusters and -1 for noise.
 * The final system runs the same idea in PostGIS with ST_ClusterDBSCAN.
 */
export function dbscan(
  points: LatLng[],
  epsMeters: number,
  minPoints: number,
): number[] {
  const UNVISITED = -2;
  const labels = points.map(() => UNVISITED);

  const neighbours = (i: number) =>
    points.reduce<number[]>((found, p, j) => {
      if (distanceMeters(points[i], p) <= epsMeters) found.push(j);
      return found;
    }, []);

  let cluster = 0;
  for (let i = 0; i < points.length; i++) {
    if (labels[i] !== UNVISITED) continue;

    const seeds = neighbours(i);
    if (seeds.length < minPoints) {
      labels[i] = NOISE;
      continue;
    }

    labels[i] = cluster;
    const queue = seeds.filter((j) => j !== i);
    while (queue.length > 0) {
      const j = queue.shift() as number;
      if (labels[j] === NOISE) labels[j] = cluster;
      if (labels[j] !== UNVISITED) continue;
      labels[j] = cluster;
      const reach = neighbours(j);
      if (reach.length >= minPoints) queue.push(...reach);
    }
    cluster++;
  }
  return labels;
}

/** Starting weights. They add up to 1 and will be tuned with the team. */
export const RISK_WEIGHTS: RiskFactors = {
  frequency: 0.3,
  recurrence: 0.2,
  severity: 0.2,
  urgency: 0.1,
  proximity: 0.2,
};

export const HIGH_RISK_FROM = 0.7;
export const MEDIUM_RISK_FROM = 0.4;

const SEVERITY: Record<Category, number> = {
  "open-manhole": 1,
  waterlogging: 0.7,
  pothole: 0.6,
  other: 0.3,
};

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

export function riskLevel(score: number): RiskLevel {
  if (score >= HIGH_RISK_FROM) return "high";
  if (score >= MEDIUM_RISK_FROM) return "medium";
  return "low";
}

/** Location Risk Index: a weighted sum of five factors, each between 0 and 1. */
export function riskScore(factors: RiskFactors): number {
  const score = (Object.keys(RISK_WEIGHTS) as (keyof RiskFactors)[]).reduce(
    (sum, key) => sum + RISK_WEIGHTS[key] * clamp01(factors[key]),
    0,
  );
  return Math.round(score * 1000) / 1000;
}

const PROXIMITY_REACH_M: Record<NearbyPlace["kind"], number> = {
  school: 250,
  hospital: 250,
  "major-road": 150,
};

export function findNearby(center: LatLng, places: Place[]): NearbyPlace[] {
  return places
    .map((place) => ({
      kind: place.kind,
      name: place.name,
      distance: distanceMeters(center, place),
    }))
    .filter((p) => p.distance <= PROXIMITY_REACH_M[p.kind])
    .sort((a, b) => a.distance - b.distance);
}

/** Closer to a school or hospital means a higher score; major roads count less. */
export function proximityScore(nearby: NearbyPlace[]): number {
  return nearby.reduce((best, p) => {
    const weight = p.kind === "major-road" ? 0.6 : 1;
    const closeness = 1 - p.distance / PROXIMITY_REACH_M[p.kind];
    return Math.max(best, weight * closeness);
  }, 0);
}

function mostCommon<T>(items: T[]): T {
  const counts = new Map<T, number>();
  for (const item of items) counts.set(item, (counts.get(item) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

/** Group complaints into hotspots and rank them by Location Risk Index. */
export function buildHotspots(
  complaints: Complaint[],
  places: Place[],
): Hotspot[] {
  const labels = dbscan(complaints, HOTSPOT_RADIUS_M, HOTSPOT_MIN_REPORTS);
  const groups = new Map<number, Complaint[]>();
  labels.forEach((label, i) => {
    if (label === NOISE) return;
    groups.set(label, [...(groups.get(label) ?? []), complaints[i]]);
  });

  const hotspots = [...groups.values()].map((members) => {
    const center = centroid(members);
    const nearby = findNearby(center, places);
    const repeats = members.filter((c) => c.repeatAfterRepair).length;
    const factors: RiskFactors = {
      frequency: members.length / 10,
      recurrence: repeats / 3,
      severity:
        members.reduce((sum, c) => sum + SEVERITY[c.category], 0) /
        members.length,
      urgency:
        members.reduce((sum, c) => sum + c.urgency, 0) / members.length / 5,
      proximity: proximityScore(nearby),
    };
    const score = riskScore(factors);
    const lead = members[0];
    return {
      ...center,
      key: members.map((c) => c.id).sort()[0],
      complaintIds: members.map((c) => c.id),
      count: members.length,
      category: mostCommon(members.map((c) => c.category)),
      area: lead.area,
      corporation: lead.corporation,
      ward: lead.ward,
      radiusM: Math.max(
        HOTSPOT_RADIUS_M / 2,
        ...members.map((c) => distanceMeters(center, c)),
      ),
      factors,
      score,
      level: riskLevel(score),
      nearby,
    };
  });

  return hotspots
    .sort((a, b) => b.score - a.score || a.key.localeCompare(b.key))
    .map((h, i) => ({ ...h, id: `H-${String(i + 1).padStart(2, "0")}` }));
}

/** Open or closed complaints within `radiusM` of a point, nearest first. */
export function complaintsNear(
  point: LatLng,
  complaints: Complaint[],
  radiusM = HOTSPOT_RADIUS_M,
): { complaint: Complaint; distance: number }[] {
  return complaints
    .map((complaint) => ({ complaint, distance: distanceMeters(point, complaint) }))
    .filter((c) => c.distance <= radiusM)
    .sort((a, b) => a.distance - b.distance);
}
