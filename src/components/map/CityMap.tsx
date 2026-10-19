"use client";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import { useDark } from "@/lib/store/hooks";
import type { Hotspot, LatLng, Place, RiskLevel } from "@/lib/types";

export interface MapPoint extends LatLng {
  id: string;
  label: string;
  /** Drawn fainter, for complaints that are already fixed. */
  muted?: boolean;
}

interface CityMapProps {
  center: LatLng;
  zoom: number;
  label: string;
  className?: string;
  points?: MapPoint[];
  hotspots?: Hotspot[];
  selectedHotspotId?: string | null;
  onSelectHotspot?: (key: string) => void;
  /** Schools, hospitals and main roads, drawn as small diamonds. */
  places?: Place[];
  /** Show a movable pin and call back when the user clicks the map. */
  pin?: LatLng | null;
  onPick?: (point: LatLng) => void;
  scrollZoom?: boolean;
}

const PIN_HTML = `
  <svg width="34" height="44" viewBox="0 0 34 44" aria-hidden="true">
    <path d="M17 2C9 2 3 8 3 16c0 10 14 26 14 26s14-16 14-26C31 8 25 2 17 2z" fill="var(--brand)" stroke="#fff" stroke-width="3"/>
    <circle cx="17" cy="16" r="5.5" fill="#fff"/>
  </svg>`;

function paints() {
  const css = getComputedStyle(document.documentElement);
  const read = (name: string) => css.getPropertyValue(name).trim();
  return {
    ring: {
      high: read("--signal"),
      medium: read("--survey"),
      low: read("--brand-ink"),
    } satisfies Record<RiskLevel, string>,
    dot: read("--ink"),
    edge: read("--panel"),
  };
}

export default function CityMap({
  center,
  zoom,
  label,
  className,
  points,
  hotspots,
  selectedHotspotId,
  onSelectHotspot,
  places,
  pin,
  onPick,
  scrollZoom = false,
}: CityMapProps) {
  const dark = useDark();
  const element = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);
  const pinMarker = useRef<L.Marker | null>(null);
  const drawn = useRef<Set<string> | null>(null);
  const onPickRef = useRef(onPick);
  const onSelectRef = useRef(onSelectHotspot);

  useEffect(() => {
    onPickRef.current = onPick;
    onSelectRef.current = onSelectHotspot;
  });

  // Create the map once.
  useEffect(() => {
    if (!element.current || map.current) return;
    const instance = L.map(element.current, {
      center: [center.lat, center.lng],
      zoom,
      scrollWheelZoom: scrollZoom,
      zoomSnap: 0.5,
      zoomControl: false,
    });
    L.control.zoom({ position: "bottomright" }).addTo(instance);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(instance);
    layer.current = L.layerGroup().addTo(instance);
    instance.on("click", (e: L.LeafletMouseEvent) => {
      onPickRef.current?.({ lat: e.latlng.lat, lng: e.latlng.lng });
    });
    map.current = instance;
    return () => {
      instance.remove();
      map.current = null;
      layer.current = null;
      pinMarker.current = null;
      drawn.current = null;
    };
    // The map is created once. Later changes to center and zoom are handled below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Move the view when the centre changes.
  useEffect(() => {
    map.current?.flyTo([center.lat, center.lng], zoom, { duration: 0.8 });
  }, [center.lat, center.lng, zoom]);

  // Draw complaints and hotspots.
  useEffect(() => {
    const group = layer.current;
    if (!group) return;
    group.clearLayers();
    const colour = paints();

    for (const p of points ?? []) {
      L.circleMarker([p.lat, p.lng], {
        radius: p.muted ? 4 : 5,
        weight: 2,
        color: colour.edge,
        fillColor: colour.dot,
        fillOpacity: p.muted ? 0.3 : 0.85,
      })
        .bindTooltip(p.label)
        .addTo(group);
    }

    for (const place of places ?? []) {
      L.marker([place.lat, place.lng], {
        keyboard: false,
        icon: L.divIcon({
          className: "map-place",
          html: "<span></span>",
          iconSize: [12, 12],
          iconAnchor: [6, 6],
        }),
      })
        .bindTooltip(place.name, { direction: "top" })
        .addTo(group);
    }

    // Rings that were not on the map before are painted on.
    const known = drawn.current;
    const nowDrawn = new Set<string>();

    for (const h of hotspots ?? []) {
      nowDrawn.add(h.key);
      const selected = h.key === selectedHotspotId;
      const color = colour.ring[h.level];
      const radius = 10 + h.count * 1.6;
      const ring = L.circleMarker([h.lat, h.lng], {
        radius,
        weight: selected ? 9 : 6,
        color,
        opacity: 1,
        fill: true,
        fillColor: color,
        fillOpacity: selected ? 0.22 : 0.1,
        dashArray: h.level === "medium" ? "10 8" : undefined,
      });
      if (selected) {
        L.circleMarker([h.lat, h.lng], {
          radius: radius + 11,
          weight: 2.5,
          color: colour.dot,
          dashArray: "2 6",
          fill: false,
          interactive: false,
        }).addTo(group);
      }
      ring
        .bindTooltip(`${h.id}: ${h.area}, ${h.count} reports`, { direction: "top" })
        .on("click", (e: L.LeafletMouseEvent) => {
          L.DomEvent.stopPropagation(e);
          onSelectRef.current?.(h.key);
        })
        .addTo(group);

      if (known && !known.has(h.key)) {
        const path = ring.getElement() as SVGPathElement | undefined;
        if (path) {
          path.setAttribute("pathLength", "1");
          path.classList.add("paint-ring");
          path.addEventListener("animationend", () => path.classList.remove("paint-ring"), {
            once: true,
          });
        }
      }
    }
    drawn.current = nowDrawn;
  }, [points, hotspots, places, selectedHotspotId, dark]);

  // Show the report pin.
  useEffect(() => {
    const instance = map.current;
    if (!instance) return;
    if (!pin) {
      pinMarker.current?.remove();
      pinMarker.current = null;
      return;
    }
    if (pinMarker.current) {
      pinMarker.current.setLatLng([pin.lat, pin.lng]);
    } else {
      pinMarker.current = L.marker([pin.lat, pin.lng], {
        icon: L.divIcon({
          html: PIN_HTML,
          className: "",
          iconSize: [34, 44],
          iconAnchor: [17, 42],
        }),
        keyboard: false,
      }).addTo(instance);
    }
  }, [pin]);

  return (
    <div
      ref={element}
      role="region"
      aria-label={label}
      className={className}
    />
  );
}
