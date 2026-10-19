import type { Place, Zone } from "./types";

/**
 * Areas that stand in for ward matching. Centres are approximate and the ward
 * numbers are placeholders, so none of this is an official ward boundary. The
 * final system matches a pin to the corporations' real ward map.
 */
export const ZONES: Zone[] = [
  // Dhaka North
  { id: "uttara-7", name: "Uttara Sector 7", corporation: "DNCC", ward: 1, lat: 23.8759, lng: 90.3795 },
  { id: "mirpur-10", name: "Mirpur-10", corporation: "DNCC", ward: 2, lat: 23.8069, lng: 90.3687 },
  { id: "pallabi", name: "Pallabi", corporation: "DNCC", ward: 3, lat: 23.8286, lng: 90.3639 },
  { id: "khilkhet", name: "Khilkhet", corporation: "DNCC", ward: 17, lat: 23.8296, lng: 90.42 },
  { id: "banani", name: "Banani", corporation: "DNCC", ward: 18, lat: 23.7937, lng: 90.4066 },
  { id: "gulshan-2", name: "Gulshan-2", corporation: "DNCC", ward: 19, lat: 23.7948, lng: 90.4143 },
  { id: "mohakhali", name: "Mohakhali", corporation: "DNCC", ward: 20, lat: 23.7776, lng: 90.4045 },
  { id: "badda", name: "Badda", corporation: "DNCC", ward: 21, lat: 23.7806, lng: 90.4258 },
  { id: "tejgaon", name: "Tejgaon", corporation: "DNCC", ward: 25, lat: 23.764, lng: 90.3925 },
  { id: "agargaon", name: "Agargaon", corporation: "DNCC", ward: 28, lat: 23.7774, lng: 90.3794 },
  // Dhaka South
  { id: "motijheel", name: "Motijheel", corporation: "DSCC", ward: 10, lat: 23.733, lng: 90.4172 },
  { id: "shahbagh", name: "Shahbagh", corporation: "DSCC", ward: 12, lat: 23.7388, lng: 90.3958 },
  { id: "eskaton", name: "Eskaton", corporation: "DSCC", ward: 13, lat: 23.7455, lng: 90.4018 },
  { id: "dhanmondi-27", name: "Dhanmondi 27", corporation: "DSCC", ward: 14, lat: 23.7561, lng: 90.3742 },
  { id: "new-market", name: "New Market", corporation: "DSCC", ward: 15, lat: 23.7333, lng: 90.385 },
  { id: "lalbagh", name: "Lalbagh", corporation: "DSCC", ward: 22, lat: 23.7189, lng: 90.388 },
  { id: "khilgaon", name: "Khilgaon", corporation: "DSCC", ward: 24, lat: 23.7508, lng: 90.4297 },
  { id: "gulistan", name: "Gulistan", corporation: "DSCC", ward: 27, lat: 23.7233, lng: 90.4126 },
  { id: "jatrabari", name: "Jatrabari", corporation: "DSCC", ward: 29, lat: 23.7104, lng: 90.4344 },
  { id: "wari", name: "Wari", corporation: "DSCC", ward: 35, lat: 23.7176, lng: 90.4193 },
];

export function getZone(id: string): Zone {
  const zone = ZONES.find((z) => z.id === id);
  if (!zone) throw new Error(`Unknown zone: ${id}`);
  return zone;
}

/**
 * A box around Dhaka North and Dhaka South. A report outside it is turned away,
 * because no other corporation is served. The real ward map replaces the box.
 */
export const SERVICE_AREA = { south: 23.68, north: 23.91, west: 90.33, east: 90.5 };

export function inServiceArea(point: { lat: number; lng: number }): boolean {
  return (
    point.lat >= SERVICE_AREA.south &&
    point.lat <= SERVICE_AREA.north &&
    point.lng >= SERVICE_AREA.west &&
    point.lng <= SERVICE_AREA.east
  );
}

/**
 * Schools, hospitals and major road crossings that the risk index looks for near
 * a hotspot. These are real places, with coordinates from their Wikipedia entries,
 * and only a start: the final system loads every school, hospital and main road
 * from OpenStreetMap.
 */
export const PLACES: Place[] = [
  { id: "dhaka-shishu-hospital", name: "Dhaka Shishu Hospital", kind: "hospital", lat: 23.7732, lng: 90.3689 },
  { id: "dmch", name: "Dhaka Medical College Hospital", kind: "hospital", lat: 23.7257, lng: 90.3971 },
  { id: "holy-family", name: "Holy Family Red Crescent Hospital", kind: "hospital", lat: 23.7465, lng: 90.4026 },
  { id: "viqarunnisa", name: "Viqarunnisa Noon School and College", kind: "school", lat: 23.7425, lng: 90.4071 },
  { id: "notre-dame", name: "Notre Dame College", kind: "school", lat: 23.731, lng: 90.4209 },
  { id: "mirpur-college", name: "Mirpur College", kind: "school", lat: 23.8042, lng: 90.3605 },
  { id: "mohakhali-flyover", name: "Mohakhali Flyover", kind: "major-road", lat: 23.7782, lng: 90.3975 },
  { id: "jatrabari-flyover", name: "Jatrabari–Gulistan Flyover", kind: "major-road", lat: 23.7125, lng: 90.4285 },
];
