import { describe, expect, it } from "vitest";
import {
  dueDate,
  formatTimeLeft,
  isClosed,
  isOverdue,
  nextStatus,
  slaHours,
  timeLeft,
} from "./sla";
import { NOW, complaint, later } from "./fixtures";

describe("SLA deadlines", () => {
  it("gives urgent complaints less time", () => {
    expect(slaHours(5)).toBeLessThan(slaHours(3));
    expect(slaHours(3)).toBeLessThan(slaHours(1));
  });

  it("adds the SLA hours to the report time", () => {
    expect(dueDate("2026-10-01T00:00:00.000Z", 5)).toBe("2026-10-02T00:00:00.000Z");
  });

  it("reports time left and time overdue", () => {
    const now = "2026-10-02T00:00:00.000Z";
    expect(timeLeft("2026-10-02T05:00:00.000Z", now)).toEqual({ overdue: false, hours: 5 });
    expect(timeLeft("2026-10-01T20:00:00.000Z", now)).toEqual({ overdue: true, hours: 4 });
  });

  it("writes durations in plain words", () => {
    expect(formatTimeLeft({ overdue: false, hours: 52.4 })).toBe("2 d 4 h left");
    expect(formatTimeLeft({ overdue: true, hours: 5 })).toBe("5 h overdue");
    expect(formatTimeLeft({ overdue: false, hours: 5.2 })).toBe("5 h 12 m left");
    expect(formatTimeLeft({ overdue: false, hours: 0.4 })).toBe("24 m left");
    expect(formatTimeLeft({ overdue: true, hours: 0.005 })).toBe("under 1 m overdue");
  });
});

describe("ticket lifecycle", () => {
  it("moves a ticket forward one step at a time", () => {
    expect(nextStatus("open")).toBe("assigned");
    expect(nextStatus("assigned")).toBe("in-progress");
    expect(nextStatus("in-progress")).toBe("resolved");
    expect(nextStatus("resolved")).toBe("verified");
    expect(nextStatus("verified")).toBeNull();
  });

  it("lets a senior engineer take over an escalated ticket", () => {
    expect(nextStatus("escalated")).toBe("in-progress");
  });

  it("treats resolved and verified tickets as closed", () => {
    expect(isClosed("resolved")).toBe(true);
    expect(isClosed("verified")).toBe(true);
    expect(isClosed("open")).toBe(false);
  });
});

describe("overdue tickets", () => {
  it("never marks a closed ticket as overdue", () => {
    const old = later(NOW, -24 * 30);
    expect(isOverdue(complaint("resolved", { reportedAt: old }), NOW)).toBe(false);
    expect(isOverdue(complaint("verified", { reportedAt: old }), NOW)).toBe(false);
  });

  it("marks an open ticket overdue once its deadline passes", () => {
    const reportedAt = later(NOW, -25);
    expect(isOverdue(complaint("open", { urgency: 5, reportedAt }), NOW)).toBe(true);
    expect(isOverdue(complaint("open", { urgency: 4, reportedAt }), NOW)).toBe(false);
  });
});

describe("ticket history", () => {
  it("starts at open and ends at the current status", () => {
    for (const status of ["open", "assigned", "in-progress", "resolved", "verified", "escalated"] as const) {
      const c = complaint(status);
      expect(c.history[0].status).toBe("open");
      expect(c.history.at(-1)?.status).toBe(status);
    }
  });
});
