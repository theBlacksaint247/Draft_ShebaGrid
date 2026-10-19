import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/** The store runs in the browser, so give it a window and a localStorage to use. */
function installBrowser() {
  const data = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
  });
  vi.stubGlobal("window", {
    setTimeout: globalThis.setTimeout.bind(globalThis),
    clearTimeout: globalThis.clearTimeout.bind(globalThis),
    setInterval: globalThis.setInterval.bind(globalThis),
    clearInterval: globalThis.clearInterval.bind(globalThis),
    addEventListener: () => {},
    removeEventListener: () => {},
  });
  return data;
}

const spot = { lat: 23.8069, lng: 90.3687, category: "pothole" as const, description: "A deep hole", urgency: 5 as const };

async function freshStore() {
  vi.resetModules();
  const store = await import("./demo");
  const toasts = await import("./toasts");
  return { ...store, toasts: toasts.toasts };
}

describe("the browser store", () => {
  let data: Map<string, string>;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-19T06:00:00.000Z"));
    data = installBrowser();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("starts with no complaints", async () => {
    const { demo, startDemo } = await freshStore();
    const stop = startDemo();
    expect(demo.get().complaints).toEqual([]);
    stop();
  });

  it("files a complaint with the next number and saves it", async () => {
    const { demo, submitComplaint, startDemo } = await freshStore();
    const stop = startDemo();
    const first = submitComplaint(spot);
    const second = submitComplaint(spot);
    expect([first.id, second.id]).toEqual(["SG-0001", "SG-0002"]);
    expect(first.mine).toBe(true);
    expect(first.reportedAt).toBe("2026-10-19T06:00:00.000Z");
    expect(demo.get().fresh).toEqual(["SG-0001", "SG-0002"]);
    expect(JSON.parse(data.get("shebagrid.demo.v3") ?? "{}").complaints).toHaveLength(2);
    stop();
  });

  it("brings saved complaints back after a reload", async () => {
    const one = await freshStore();
    const stopOne = one.startDemo();
    one.submitComplaint(spot);
    stopOne();

    const two = await freshStore();
    const stopTwo = two.startDemo();
    expect(two.demo.get().complaints.map((c) => c.id)).toEqual(["SG-0001"]);
    expect(two.demo.get().fresh).toEqual([]);
    stopTwo();
  });

  it("drops the sample data an older version saved", async () => {
    data.set("shebagrid.demo.v2", JSON.stringify({ version: 2, state: { complaints: [{}] } }));
    const { demo, startDemo } = await freshStore();
    const stop = startDemo();
    expect(demo.get().complaints).toEqual([]);
    expect(data.has("shebagrid.demo.v2")).toBe(false);
    stop();
  });

  it("moves a ticket on for an allowed role, and undoes it", async () => {
    const { demo, submitComplaint, moveTicket, startDemo, toasts } = await freshStore();
    const stop = startDemo();
    const { id } = submitComplaint(spot);

    moveTicket(id, { role: "resident", name: "Someone" });
    expect(demo.get().complaints[0].status).toBe("open");

    moveTicket(id, { role: "engineer", name: "Engr. N. Akter" });
    expect(demo.get().complaints[0].status).toBe("assigned");
    expect(demo.get().complaints[0].assignee).toBe("Engr. N. Akter");

    const undo = toasts.get().at(-1)?.action;
    expect(undo?.label).toBe("Undo");
    undo?.run();
    expect(demo.get().complaints[0].status).toBe("open");
    stop();
  });

  it("escalates a worked-on ticket when time is skipped past its deadline", async () => {
    const { demo, submitComplaint, moveTicket, skipAhead, startDemo, toasts } = await freshStore();
    const stop = startDemo();
    const { id } = submitComplaint(spot);
    moveTicket(id, { role: "engineer", name: "Engr. N. Akter" });

    skipAhead(6);
    expect(demo.get().complaints[0].status).toBe("assigned");
    skipAhead(24);
    expect(demo.get().complaints[0].status).toBe("escalated");
    expect(toasts.get().some((t) => t.text.includes("missed its deadline"))).toBe(true);
    stop();
  });

  it("keeps skipped time after a reload, and clears it with the data", async () => {
    const one = await freshStore();
    const stopOne = one.startDemo();
    one.submitComplaint(spot);
    one.skipAhead(24);
    stopOne();

    const two = await freshStore();
    const stopTwo = two.startDemo();
    expect(two.clock.get() - Date.now()).toBe(24 * 3_600_000);
    two.clearData();
    expect(two.demo.get().complaints).toEqual([]);
    expect(two.clock.get()).toBe(Date.now());
    expect(data.has("shebagrid.demo.v3")).toBe(false);
    stopTwo();
  });

  it("follows the real clock", async () => {
    const { clock, startDemo } = await freshStore();
    const stop = startDemo();
    const start = clock.get();
    vi.advanceTimersByTime(60_000);
    expect(clock.get() - start).toBe(60_000);
    stop();
  });

  it("still saves when photos do not fit in storage", async () => {
    const { submitComplaint, startDemo } = await freshStore();
    const stop = startDemo();
    const real = localStorage.setItem.bind(localStorage);
    vi.stubGlobal("localStorage", {
      ...localStorage,
      setItem: (k: string, v: string) => {
        if (v.includes("data:image")) throw new Error("QuotaExceededError");
        real(k, v);
      },
    });
    submitComplaint({ ...spot, photo: "data:image/jpeg;base64,AAAA" });
    const saved = JSON.parse(data.get("shebagrid.demo.v3") ?? "{}");
    expect(saved.complaints).toHaveLength(1);
    expect(saved.complaints[0].photo).toBeUndefined();
    stop();
  });
});
