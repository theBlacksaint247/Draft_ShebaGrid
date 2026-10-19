import { describe, expect, it } from "vitest";
import { NOW, complaint, MIRPUR } from "./fixtures";
import { offsetMeters } from "./geo";
import { complaintsNear } from "./hotspots";
import { SERVICE_AREA, ZONES, inServiceArea, getZone } from "./places";
import { createComplaint, nextComplaintId } from "./ticket";

describe("nextComplaintId", () => {
  it("starts at SG-0001 when nothing has been filed", () => {
    expect(nextComplaintId([])).toBe("SG-0001");
  });

  it("continues after the highest number", () => {
    expect(nextComplaintId([complaint("open", { id: "SG-0007" }), complaint("open", { id: "SG-0003" })])).toBe("SG-0008");
  });
});

describe("createComplaint", () => {
  const input = { ...MIRPUR, category: "pothole" as const, description: "A deep hole", urgency: 4 as const };

  it("matches the ward, sets the deadline from urgency and opens the ticket", () => {
    const c = createComplaint({ ...input, mine: true }, [], NOW);
    expect(c.id).toBe("SG-0001");
    expect(c.area).toBe("Mirpur-10");
    expect(c.corporation).toBe("DNCC");
    expect(c.ward).toBe(2);
    expect(c.status).toBe("open");
    expect(Date.parse(c.dueAt) - Date.parse(NOW)).toBe(48 * 3_600_000);
    expect(c.mine).toBe(true);
    expect(c.title).toBe("Pothole near Mirpur-10");
    expect(c.history).toEqual([{ status: "open", at: NOW }]);
  });

  it("sends a report in the south to DSCC", () => {
    const c = createComplaint({ ...input, ...getZone("motijheel") }, [], NOW);
    expect(c.corporation).toBe("DSCC");
    expect(c.area).toBe("Motijheel");
  });

  it("matches a pin to the nearest area", () => {
    const hospital = { lat: 23.7467, lng: 90.4027 };
    const c = createComplaint({ ...input, ...hospital }, [], NOW);
    expect(c.area).toBe("Eskaton");
    expect(c.corporation).toBe("DSCC");
  });

  it("only has the photo check and photo when they were given", () => {
    const bare = createComplaint(input, [], NOW);
    expect("aiLabel" in bare).toBe(false);
    expect("photo" in bare).toBe(false);
    const withPhoto = createComplaint(
      { ...input, photo: "data:image/jpeg;base64,AA", aiLabel: { category: "pothole", confidence: 0.9 } },
      [],
      NOW,
    );
    expect(withPhoto.photo).toBe("data:image/jpeg;base64,AA");
    expect(withPhoto.aiLabel?.confidence).toBe(0.9);
  });

  it("marks a report as 'came back' when a repair was recorded at the same spot", () => {
    const fixed = complaint("verified", { at: MIRPUR });
    expect(createComplaint(input, [fixed], NOW).repeatAfterRepair).toBe(true);
    expect(createComplaint({ ...input, ...offsetMeters(MIRPUR, 200, 0) }, [fixed], NOW).repeatAfterRepair).toBe(false);
    expect(createComplaint(input, [complaint("open")], NOW).repeatAfterRepair).toBe(false);
  });

  it("finds earlier reports within 50 metres, nearest first", () => {
    const here = complaint("open", { id: "SG-0001", at: MIRPUR });
    const close = complaint("open", { id: "SG-0002", at: offsetMeters(MIRPUR, 20, 0) });
    const far = complaint("open", { id: "SG-0003", at: offsetMeters(MIRPUR, 300, 0) });
    const near = complaintsNear(MIRPUR, [far, close, here]);
    expect(near.map((n) => n.complaint.id)).toEqual(["SG-0001", "SG-0002"]);
  });
});

describe("the service area", () => {
  it("covers every area on the list", () => {
    expect(ZONES.every((z) => inServiceArea(z))).toBe(true);
  });

  it("covers only DNCC and DSCC areas", () => {
    expect(new Set(ZONES.map((z) => z.corporation))).toEqual(new Set(["DNCC", "DSCC"]));
  });

  it("turns away places outside Dhaka", () => {
    expect(inServiceArea({ lat: 22.3584, lng: 91.8216 })).toBe(false);
    expect(inServiceArea({ lat: 24.9, lng: 91.87 })).toBe(false);
    expect(inServiceArea({ lat: SERVICE_AREA.north + 0.01, lng: 90.4 })).toBe(false);
  });
});
