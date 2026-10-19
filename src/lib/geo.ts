import type { LatLng, Zone } from "./types";

const EARTH_RADIUS_M = 6_371_000;

const toRad = (deg: number) => (deg * Math.PI) / 180;

/** Great-circle distance between two points, in metres. */
export function distanceMeters(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

/** Move a point by a number of metres north and east. */
export function offsetMeters(
  origin: LatLng,
  northM: number,
  eastM: number,
): LatLng {
  return {
    lat: origin.lat + northM / 111_320,
    lng: origin.lng + eastM / (111_320 * Math.cos(toRad(origin.lat))),
  };
}

export function centroid(points: LatLng[]): LatLng {
  const sum = points.reduce(
    (acc, p) => ({ lat: acc.lat + p.lat, lng: acc.lng + p.lng }),
    { lat: 0, lng: 0 },
  );
  return { lat: sum.lat / points.length, lng: sum.lng / points.length };
}

/** The zone whose centre is closest to a point. Stands in for ward matching. */
export function nearestZone(point: LatLng, zones: Zone[]): Zone {
  let best = zones[0];
  let bestDistance = Infinity;
  for (const zone of zones) {
    const d = distanceMeters(point, zone);
    if (d < bestDistance) {
      best = zone;
      bestDistance = d;
    }
  }
  return best;
}
