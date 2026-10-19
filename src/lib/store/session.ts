import { ROLES } from "../people";
import type { Role } from "../types";
import { createStore } from "./create-store";

export interface SessionState {
  /** False until the browser has been asked who is signed in. */
  hydrated: boolean;
  role: Role | null;
}

/** What the server and the first browser render both see. */
export const SERVER_SESSION: SessionState = { hydrated: false, role: null };

const KEY = "shebagrid.session";

export const session = createStore<SessionState>(SERVER_SESSION);

function read(): Role | null {
  try {
    const saved = localStorage.getItem(KEY);
    return ROLES.find((role) => role === saved) ?? null;
  } catch {
    return null;
  }
}

/** Load the demo session once the page is in the browser. */
export function hydrateSession(): () => void {
  session.set({ hydrated: true, role: read() });
  // Signing in or out in another tab updates this one.
  const onStorage = (event: StorageEvent) => {
    if (event.key === KEY) session.set({ hydrated: true, role: read() });
  };
  window.addEventListener("storage", onStorage);
  return () => window.removeEventListener("storage", onStorage);
}

export function signIn(role: Role) {
  try {
    localStorage.setItem(KEY, role);
  } catch {
    // The demo session then lasts until the page is closed.
  }
  session.set({ hydrated: true, role });
}

export function signOut() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Nothing to remove.
  }
  session.set({ hydrated: true, role: null });
}
