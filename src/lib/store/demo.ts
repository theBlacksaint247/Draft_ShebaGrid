import { buildHotspots } from "../hotspots";
import { PLACES } from "../places";
import { actionFor, actorFor, advance, escalateOverdue } from "../queue";
import { STATUS_LABEL } from "../sla";
import { createComplaint, type NewComplaint } from "../ticket";
import type { Complaint, Hotspot, Role } from "../types";
import { createStore } from "./create-store";
import { pushToast } from "./toasts";

/**
 * The prototype's stand-in for a backend. Complaints are kept in this browser
 * only, so a complaint filed as a resident can be picked up by an engineer on the
 * same computer. The final system keeps them in Supabase.
 */

export interface DemoState {
  complaints: Complaint[];
  /** Complaints filed during this visit, highlighted for a moment. */
  fresh: string[];
}

/** What the server and the first browser render both see: nothing filed yet. */
export const SERVER_DEMO: DemoState = { complaints: [], fresh: [] };

/** The time shown to people, in milliseconds. 0 until the browser sets the real time. */
export const SERVER_CLOCK = 0;

export const demo = createStore<DemoState>(SERVER_DEMO);
export const clock = createStore<number>(SERVER_CLOCK);

const KEY = "shebagrid.demo.v3";
const OLD_KEYS = ["shebagrid.demo.v2"];
const TICK_MS = 30_000;

/** Time skipped ahead, in milliseconds. It stays until the data is cleared. */
let skippedMs = 0;

const currentMs = () => Date.now() + skippedMs;
const iso = (ms: number) => new Date(ms).toISOString();

interface Saved {
  version: 3;
  complaints: Complaint[];
  skippedMs: number;
}

function write(complaints: Complaint[]) {
  const saved: Saved = { version: 3, complaints, skippedMs };
  localStorage.setItem(KEY, JSON.stringify(saved));
}

function persist() {
  try {
    write(demo.get().complaints);
  } catch {
    try {
      // Photos are the bulky part. Without room for them, keep everything else.
      write(
        demo.get().complaints.map((c) => {
          const lean = { ...c };
          delete lean.photo;
          return lean;
        }),
      );
    } catch {
      // Without storage the prototype still works until the page is closed.
    }
  }
}

function load(): Saved | null {
  try {
    for (const old of OLD_KEYS) localStorage.removeItem(old);
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw) as Saved;
    if (saved.version !== 3 || !Array.isArray(saved.complaints)) return null;
    return { ...saved, skippedMs: Number.isFinite(saved.skippedMs) ? saved.skippedMs : 0 };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------- changes

/** A resident files a complaint. */
export function submitComplaint(input: NewComplaint): Complaint {
  const state = demo.get();
  const complaint = createComplaint(
    { ...input, mine: true },
    state.complaints,
    iso(currentMs()),
  );
  demo.set({
    complaints: [...state.complaints, complaint],
    fresh: [...state.fresh, complaint.id],
  });
  persist();
  return complaint;
}

/** An officer moves a ticket to its next stage. The toast offers to undo it. */
export function moveTicket(id: string, actor: { role: Role; name: string }) {
  const state = demo.get();
  const current = state.complaints.find((c) => c.id === id);
  if (!current || !actionFor(actor.role, current.status)) return;

  const next = advance(current, iso(currentMs()), actorFor(actor.role, actor.name, current));
  demo.set({
    ...state,
    complaints: state.complaints.map((c) => (c.id === id ? next : c)),
  });
  persist();
  pushToast({
    tone: "success",
    text: `${id} is now ${STATUS_LABEL[next.status].toLowerCase()}.`,
    action: {
      label: "Undo",
      run: () => {
        demo.set((s) => ({
          ...s,
          complaints: s.complaints.map((c) => (c.id === id ? current : c)),
        }));
        persist();
      },
    },
  });
}

/** The escalation engine: anything late and being worked on goes to a senior engineer. */
function runEscalations(nowMs: number, quiet = false) {
  const state = demo.get();
  const { complaints, escalated } = escalateOverdue(state.complaints, iso(nowMs));
  if (escalated.length === 0) return;

  demo.set({ ...state, complaints });
  persist();
  if (quiet) return;

  if (escalated.length <= 2) {
    for (const c of escalated) {
      pushToast({
        tone: "alert",
        text: `${c.id} in ${c.area} missed its deadline and went to a senior engineer.`,
      });
    }
  } else {
    pushToast({
      tone: "alert",
      text: `${escalated.length} tickets missed their deadline and went to a senior engineer.`,
    });
  }
}

// ---------------------------------------------------------------- controls

/** Jump the clock forward, to show deadlines and escalation without waiting. */
export function skipAhead(hours: number) {
  skippedMs += hours * 3_600_000;
  clock.set(currentMs());
  runEscalations(currentMs());
  persist();
  pushToast({
    tone: "info",
    text: `Skipped ahead ${hours >= 24 ? `${hours / 24} day${hours >= 48 ? "s" : ""}` : `${hours} hours`}.`,
  });
}

/** Remove every complaint and put the clock back to the real time. */
export function clearData() {
  skippedMs = 0;
  demo.set(SERVER_DEMO);
  clock.set(currentMs());
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Nothing saved to remove.
  }
  pushToast({ tone: "info", text: "All complaints cleared." });
}

// ---------------------------------------------------------------- engine

function restore(saved: Saved | null) {
  skippedMs = saved?.skippedMs ?? 0;
  clock.set(currentMs());
  demo.set(saved ? { complaints: saved.complaints, fresh: [] } : SERVER_DEMO);
}

/** Load what was saved in this browser, then keep the clock and deadlines current. */
export function startDemo(): () => void {
  restore(load());
  runEscalations(currentMs(), true);

  const timer = window.setInterval(() => {
    clock.set(currentMs());
    runEscalations(currentMs());
  }, TICK_MS);
  // A change made in another tab of this browser shows up here too.
  const onStorage = (event: StorageEvent) => {
    if (event.key === KEY) restore(load());
  };
  window.addEventListener("storage", onStorage);
  return () => {
    window.clearInterval(timer);
    window.removeEventListener("storage", onStorage);
  };
}

// ---------------------------------------------------------------- derived

const hotspotCache = new WeakMap<Complaint[], Hotspot[]>();

/** Hotspots for a list of complaints. The result is remembered for each list. */
export function hotspotsFor(complaints: Complaint[]): Hotspot[] {
  let found = hotspotCache.get(complaints);
  if (!found) {
    found = buildHotspots(complaints, PLACES);
    hotspotCache.set(complaints, found);
  }
  return found;
}
