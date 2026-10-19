import { describe, expect, it } from "vitest";
import { offsetMeters } from "./geo";
import {
  HIGH_RISK_FROM,
  MEDIUM_RISK_FROM,
  NOISE,
  RISK_WEIGHTS,
  buildHotspots,
  dbscan,
  proximityScore,
  riskLevel,
  riskScore,
} from "./hotspots";
import { cluster, complaint } from "./fixtures";
import { PLACES } from "./places";
import type { Place } from "./types";

const origin = { lat: 23.8069, lng: 90.3687 };

describe("dbscan", () => {
  it("groups points within the radius and marks far points as noise", () => {
    const points = [
      origin,
      offsetMeters(origin, 10, 0),
      offsetMeters(origin, 0, 15),
      offsetMeters(origin, 500, 500),
      offsetMeters(origin, -800, 300),
    ];
    expect(dbscan(points, 50, 3)).toEqual([0, 0, 0, NOISE, NOISE]);
  });

  it("finds separate clusters", () => {
    const far = offsetMeters(origin, 2000, 0);
    const points = [
      origin,
      offsetMeters(origin, 5, 5),
      offsetMeters(origin, 8, 0),
      far,
      offsetMeters(far, 5, 5),
      offsetMeters(far, 0, 9),
    ];
    expect(dbscan(points, 50, 3)).toEqual([0, 0, 0, 1, 1, 1]);
  });

  it("needs the minimum number of points", () => {
    const points = [origin, offsetMeters(origin, 10, 0)];
    expect(dbscan(points, 50, 3)).toEqual([NOISE, NOISE]);
  });

  it("links points through a chain of neighbours", () => {
    const points = [0, 40, 80, 120].map((m) => offsetMeters(origin, m, 0));
    expect(dbscan(points, 50, 2)).toEqual([0, 0, 0, 0]);
  });
});

describe("risk index", () => {
  it("uses weights that add up to one", () => {
    const total = Object.values(RISK_WEIGHTS).reduce((a, b) => a + b, 0);
    expect(total).toBeCloseTo(1, 10);
  });

  it("scores 0 with no risk and 1 with maximum risk", () => {
    const none = { frequency: 0, recurrence: 0, severity: 0, urgency: 0, proximity: 0 };
    const all = { frequency: 1, recurrence: 1, severity: 1, urgency: 1, proximity: 1 };
    expect(riskScore(none)).toBe(0);
    expect(riskScore(all)).toBe(1);
  });

  it("caps factors above 1", () => {
    const over = { frequency: 5, recurrence: 5, severity: 5, urgency: 5, proximity: 5 };
    expect(riskScore(over)).toBe(1);
  });

  it("raises the score when more complaints arrive", () => {
    const base = { frequency: 0.3, recurrence: 0, severity: 0.6, urgency: 0.6, proximity: 0 };
    expect(riskScore({ ...base, frequency: 0.6 })).toBeGreaterThan(riskScore(base));
  });

  it("maps scores to High, Medium and Low", () => {
    expect(riskLevel(HIGH_RISK_FROM)).toBe("high");
    expect(riskLevel(HIGH_RISK_FROM - 0.01)).toBe("medium");
    expect(riskLevel(MEDIUM_RISK_FROM)).toBe("medium");
    expect(riskLevel(MEDIUM_RISK_FROM - 0.01)).toBe("low");
  });

  it("scores places near a school higher than places far away", () => {
    const near = proximityScore([{ kind: "school", name: "School", distance: 40 }]);
    const far = proximityScore([{ kind: "school", name: "School", distance: 200 }]);
    expect(near).toBeGreaterThan(far);
    expect(proximityScore([])).toBe(0);
  });

  it("counts a major road for less than a school at the same distance", () => {
    const road = proximityScore([{ kind: "major-road", name: "Road", distance: 0 }]);
    const school = proximityScore([{ kind: "school", name: "School", distance: 0 }]);
    expect(road).toBeLessThan(school);
  });
});

describe("buildHotspots", () => {
  const hospital = PLACES.find((p) => p.id === "dmch") as Place;
  const farAway = { lat: 23.8759, lng: 90.3795 };

  it("finds nothing when there are no complaints", () => {
    expect(buildHotspots([], PLACES)).toEqual([]);
  });

  it("needs three reports within 50 metres", () => {
    expect(buildHotspots(cluster(farAway, 2), PLACES)).toHaveLength(0);
    expect(buildHotspots(cluster(farAway, 3), PLACES)).toHaveLength(1);
  });

  it("keeps reports 60 metres apart out of one spot", () => {
    const apart = [0, 60, 120].map((m, i) => complaint("open", { id: `SG-000${i + 1}`, at: offsetMeters(farAway, m, 0) }));
    expect(buildHotspots(apart, PLACES)).toHaveLength(0);
  });

  it("ranks hotspots from highest to lowest risk and numbers them", () => {
    const big = cluster(origin, 8, 1, { category: "open-manhole", urgency: 5 });
    const small = cluster(farAway, 3, 20);
    const hotspots = buildHotspots([...small, ...big], PLACES);
    expect(hotspots.map((h) => h.id)).toEqual(["H-01", "H-02"]);
    expect(hotspots[0].count).toBe(8);
    expect(hotspots[0].score).toBeGreaterThan(hotspots[1].score);
  });

  it("puts every complaint in at most one hotspot", () => {
    const hotspots = buildHotspots([...cluster(origin, 5, 1), ...cluster(farAway, 4, 20)], PLACES);
    const ids = hotspots.flatMap((h) => h.complaintIds);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toHaveLength(9);
  });

  it("scores a spot beside a hospital higher, and names the hospital", () => {
    const beside = cluster(offsetMeters(hospital, 20, 0), 4);
    const away = cluster(farAway, 4, 20);
    const [near, far] = [buildHotspots(beside, PLACES)[0], buildHotspots(away, PLACES)[0]];
    expect(near.nearby[0].name).toBe(hospital.name);
    expect(near.factors.proximity).toBeGreaterThan(0);
    expect(far.nearby).toHaveLength(0);
    expect(near.score).toBeGreaterThan(far.score);
  });

  it("raises the score when a spot came back after a repair", () => {
    const plain = buildHotspots(cluster(farAway, 4), PLACES)[0];
    const repeated = buildHotspots(cluster(farAway, 4, 1, { repeatAfterRepair: true }), PLACES)[0];
    expect(repeated.score).toBeGreaterThan(plain.score);
  });

  it("names the hotspot after its earliest complaint, and keeps that name as it grows", () => {
    const three = buildHotspots(cluster(farAway, 3, 5), PLACES)[0];
    const four = buildHotspots(cluster(farAway, 4, 5), PLACES)[0];
    expect(three.key).toBe("SG-0005");
    expect(four.key).toBe(three.key);
    expect(four.score).toBeGreaterThan(three.score);
  });

  it("rates a small spot with nothing nearby as low", () => {
    expect(buildHotspots(cluster(farAway, 3), PLACES)[0].level).toBe("low");
  });
});
