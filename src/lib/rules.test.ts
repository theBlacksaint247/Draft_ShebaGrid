import { describe, expect, it } from "vitest";
import { NOW, complaint, later } from "./fixtures";
import { PERSONAS, canOpen, roleHome, wardEngineer } from "./people";
import { actionFor, actorFor, escalateOverdue } from "./queue";
import { corporationStats } from "./stats";
import { estimateUrgency } from "./urgency";

describe("escalateOverdue", () => {
  const working = complaint("assigned", { id: "SG-0001", urgency: 5, reportedAt: later(NOW, -20) });
  const afterDeadline = later(working.dueAt, 1);

  it("does nothing while no worked-on ticket is late", () => {
    const list = [working, complaint("open", { id: "SG-0002" })];
    const result = escalateOverdue(list, NOW);
    expect(result.escalated).toHaveLength(0);
    expect(result.complaints).toBe(list);
  });

  it("escalates a worked-on ticket once its deadline passes, stamped at the deadline", () => {
    const { complaints, escalated } = escalateOverdue([working], afterDeadline);
    expect(escalated.map((c) => c.id)).toEqual(["SG-0001"]);
    expect(complaints[0].status).toBe("escalated");
    expect(complaints[0].history.at(-1)).toEqual({ status: "escalated", at: working.dueAt });
    expect(escalateOverdue(complaints, afterDeadline).escalated).toHaveLength(0);
  });

  it("escalates a ticket that is in progress too", () => {
    const busy = complaint("in-progress", { urgency: 5, reportedAt: later(NOW, -20) });
    expect(escalateOverdue([busy], later(busy.dueAt, 1)).escalated).toHaveLength(1);
  });

  it("leaves open and closed tickets alone, however late", () => {
    const old = later(NOW, -24 * 30);
    const tickets = [
      complaint("open", { id: "SG-0001", reportedAt: old }),
      complaint("resolved", { id: "SG-0002", reportedAt: old }),
      complaint("verified", { id: "SG-0003", reportedAt: old }),
    ];
    const { complaints, escalated } = escalateOverdue(tickets, NOW);
    expect(escalated).toHaveLength(0);
    expect(complaints.map((c) => c.status)).toEqual(["open", "resolved", "verified"]);
  });
});

describe("who may do what", () => {
  it("lets engineers pick up and work tickets, but not verify them", () => {
    expect(actionFor("engineer", "open")).toBe("Assign to me");
    expect(actionFor("engineer", "assigned")).toBe("Start work");
    expect(actionFor("engineer", "in-progress")).toBe("Mark resolved");
    expect(actionFor("engineer", "resolved")).toBeNull();
    expect(actionFor("engineer", "escalated")).toBeNull();
  });

  it("lets only a senior engineer take over an escalated ticket", () => {
    expect(actionFor("senior", "escalated")).toBe("Take over");
    expect(actionFor("official", "escalated")).toBeNull();
  });

  it("lets only an official verify a repair, and nobody act on a closed ticket", () => {
    expect(actionFor("official", "resolved")).toBe("Verify");
    expect(actionFor("senior", "resolved")).toBeNull();
    expect(actionFor("official", "verified")).toBeNull();
    expect(actionFor("resident", "open")).toBeNull();
    expect(actionFor(null, "open")).toBeNull();
  });

  it("records the ward's engineer when an official assigns a ticket", () => {
    const open = complaint("open");
    expect(actorFor("official", PERSONAS.official.name, open)).toBe("Ward 2 engineer, DNCC");
    expect(actorFor("engineer", PERSONAS.engineer.name, open)).toBe(PERSONAS.engineer.name);
    expect(wardEngineer("DSCC", 14)).toBe("Ward 14 engineer, DSCC");
  });
});

describe("page access by role", () => {
  it("keeps the report form and My complaints for residents", () => {
    expect(canOpen("resident", "/report")).toBe(true);
    expect(canOpen("resident", "/complaints")).toBe(true);
    expect(canOpen("engineer", "/report")).toBe(false);
    expect(canOpen("official", "/complaints")).toBe(false);
  });

  it("keeps the dashboard and hotspot map for engineers and officials", () => {
    for (const role of ["engineer", "senior", "official"] as const) {
      expect(canOpen(role, "/dashboard")).toBe(true);
      expect(canOpen(role, "/hotspots")).toBe(true);
    }
    expect(canOpen("resident", "/dashboard")).toBe(false);
    expect(canOpen("resident", "/hotspots")).toBe(false);
  });

  it("lets everyone signed in open a complaint page, and sends each role home", () => {
    expect(canOpen("resident", "/complaints/SG-0001")).toBe(true);
    expect(canOpen("senior", "/complaints/SG-0001")).toBe(true);
    expect(roleHome("resident")).toBe("/complaints");
    expect(roleHome("engineer")).toBe("/dashboard");
  });
});

describe("estimateUrgency", () => {
  it("starts from the kind of hazard", () => {
    expect(estimateUrgency("", "pothole").urgency).toBe(3);
    expect(estimateUrgency("", "open-manhole").urgency).toBe(4);
    expect(estimateUrgency("", "other").urgency).toBe(2);
  });

  it("raises urgency for children, hospitals and injuries, in English and Bangla", () => {
    expect(estimateUrgency("Children walk past this hole to school", "pothole").urgency).toBe(4);
    expect(estimateUrgency("স্কুলের বাচ্চারা এখান দিয়ে যায়", "pothole").urgency).toBe(4);
    const worst = estimateUrgency(
      "Deep hole on the main road near the hospital, a rider fell last night",
      "open-manhole",
    );
    expect(worst.urgency).toBe(5);
    expect(worst.reasons.length).toBeGreaterThan(2);
  });

  it("lowers urgency for small problems and stays between 1 and 5", () => {
    expect(estimateUrgency("a small crack", "other").urgency).toBe(1);
    expect(estimateUrgency("small", "other").urgency).toBeGreaterThanOrEqual(1);
  });
});

describe("corporationStats", () => {
  it("is empty with no complaints", () => {
    const stats = corporationStats([], "DNCC", NOW);
    expect(stats).toEqual({ open: 0, fixedThisWeek: 0, onTimePercent: null, perDay: Array(14).fill(0) });
  });

  it("counts each corporation's own tickets", () => {
    const south = { ...complaint("open", { id: "SG-0003" }), corporation: "DSCC" as const };
    const tickets = [
      complaint("open", { id: "SG-0001" }),
      complaint("verified", { id: "SG-0002" }),
      south,
    ];
    const north = corporationStats(tickets, "DNCC", NOW);
    expect(north.open).toBe(1);
    expect(north.fixedThisWeek).toBe(1);
    expect(north.onTimePercent).toBe(100);
    expect(north.perDay.at(-1)).toBe(2);
    expect(corporationStats(tickets, "DSCC", NOW).open).toBe(1);
  });

  it("counts a repair finished after the deadline as late", () => {
    const lateFix = complaint("resolved", { urgency: 5, reportedAt: later(NOW, -40) });
    lateFix.history = lateFix.history.map((e) =>
      e.status === "resolved" ? { ...e, at: later(NOW, -2) } : e,
    );
    expect(corporationStats([lateFix], "DNCC", NOW).onTimePercent).toBe(0);
  });
});

describe("timelineRows", () => {
  it("lists the steps that happened, then the steps still to come", async () => {
    const { timelineRows } = await import("./timeline");
    const rows = timelineRows(complaint("assigned").history);
    expect(rows.map((r) => r.status)).toEqual(["open", "assigned", "in-progress", "resolved", "verified"]);
    expect(rows.map((r) => Boolean(r.at))).toEqual([true, true, false, false, false]);
  });

  it("puts an escalation where it happened, and looks ahead to the takeover", async () => {
    const { timelineRows } = await import("./timeline");
    const history = [
      ...complaint("in-progress").history,
      { status: "escalated" as const, at: later(NOW, 1) },
    ];
    const rows = timelineRows(history);
    expect(rows.map((r) => r.status)).toEqual([
      "open", "assigned", "in-progress", "escalated", "in-progress", "resolved", "verified",
    ]);
    expect(rows.filter((r) => r.at)).toHaveLength(4);
  });

  it("has nothing left to come once verified", async () => {
    const { timelineRows } = await import("./timeline");
    const rows = timelineRows(complaint("verified").history);
    expect(rows.every((r) => r.at)).toBe(true);
  });
});
