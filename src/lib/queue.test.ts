import { describe, expect, it } from "vitest";
import { NOW, complaint, later } from "./fixtures";
import { advance, compareByPriority, summarize } from "./queue";
import { isClosed, isOverdue } from "./sla";

// Reported 6 h before NOW. Urgency 5 is due after 24 h, so these are due at 18 h from reporting.
const onTime = (id: string, urgency = 3 as const) => complaint("assigned", { id, urgency });
const late = (id: string, hoursLate: number) =>
  complaint("assigned", { id, urgency: 5, reportedAt: later(NOW, -24 - hoursLate) });

describe("compareByPriority", () => {
  const tickets = [
    complaint("verified", { id: "SG-0001", urgency: 5 }),
    onTime("SG-0002"),
    late("SG-0003", 2),
    complaint("open", { id: "SG-0004", urgency: 5 }),
    late("SG-0005", 9),
    complaint("resolved", { id: "SG-0006" }),
  ];
  const sorted = [...tickets].sort(compareByPriority(NOW));

  it("puts open work before closed work", () => {
    const firstClosed = sorted.findIndex((c) => isClosed(c.status));
    expect(sorted.slice(firstClosed).every((c) => isClosed(c.status))).toBe(true);
    expect(sorted.slice(0, firstClosed).some((c) => isClosed(c.status))).toBe(false);
  });

  it("puts overdue tickets first, the most overdue at the top", () => {
    expect(sorted.slice(0, 2).map((c) => c.id)).toEqual(["SG-0005", "SG-0003"]);
    expect(sorted.slice(0, 2).every((c) => isOverdue(c, NOW))).toBe(true);
  });

  it("then puts the more urgent ticket first", () => {
    const rest = sorted.filter((c) => !isClosed(c.status) && !isOverdue(c, NOW));
    expect(rest.map((c) => c.id)).toEqual(["SG-0004", "SG-0002"]);
  });
});

describe("summarize", () => {
  it("counts open, overdue, escalated and recently fixed tickets", () => {
    const s = summarize(
      [
        onTime("SG-0001"),
        late("SG-0002", 1),
        complaint("escalated", { id: "SG-0003", urgency: 5, reportedAt: later(NOW, -30) }),
        complaint("verified", { id: "SG-0004" }),
        complaint("resolved", { id: "SG-0005", reportedAt: later(NOW, -24 * 20) }),
      ],
      NOW,
    );
    expect(s.open).toBe(3);
    expect(s.overdue).toBe(2);
    expect(s.escalated).toBe(1);
    expect(s.fixedThisWeek).toBe(1);
  });

  it("is all zeros with no complaints", () => {
    expect(summarize([], NOW)).toEqual({ open: 0, overdue: 0, escalated: 0, fixedThisWeek: 0 });
  });
});

describe("advance", () => {
  it("moves a ticket one step, assigns it and records the time", () => {
    const open = complaint("open");
    const next = advance(open, NOW, "Engr. Test");
    expect(next.status).toBe("assigned");
    expect(next.assignee).toBe("Engr. Test");
    expect(next.history.at(-1)).toEqual({ status: "assigned", at: NOW });
    expect(open.status).toBe("open");
  });

  it("keeps the engineer who already has the ticket", () => {
    const next = advance(complaint("assigned", { assignee: "Ward 2 engineer, DNCC" }), NOW, "Engr. Other");
    expect(next.status).toBe("in-progress");
    expect(next.assignee).toBe("Ward 2 engineer, DNCC");
  });

  it("hands an escalated ticket to whoever takes it over", () => {
    expect(advance(complaint("escalated"), NOW, "Engr. S. Rahman").assignee).toBe("Engr. S. Rahman");
  });

  it("leaves a verified ticket alone", () => {
    const verified = complaint("verified");
    expect(advance(verified, NOW)).toBe(verified);
  });
});
