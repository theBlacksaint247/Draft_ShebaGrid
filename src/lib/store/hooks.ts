"use client";

import { useSyncExternalStore } from "react";
import { SERVER_CLOCK, SERVER_DEMO, clock, demo, hotspotsFor } from "./demo";
import { SERVER_SESSION, session } from "./session";
import { theme } from "./theme";
import { toasts } from "./toasts";

export function useSession() {
  return useSyncExternalStore(session.subscribe, session.get, () => SERVER_SESSION);
}

export function useComplaints() {
  return useSyncExternalStore(
    demo.subscribe,
    () => demo.get().complaints,
    () => SERVER_DEMO.complaints,
  );
}

export function useHotspots() {
  return hotspotsFor(useComplaints());
}

export function useFresh() {
  return useSyncExternalStore(
    demo.subscribe,
    () => demo.get().fresh,
    () => SERVER_DEMO.fresh,
  );
}

const MINUTE = 60_000;

/** The time, rounded down to the minute, so a list does not re-sort more than once a minute. */
export function useNowMinute() {
  return useSyncExternalStore(
    clock.subscribe,
    () => Math.floor(clock.get() / MINUTE) * MINUTE,
    () => Math.floor(SERVER_CLOCK / MINUTE) * MINUTE,
  );
}

export function useNowIso() {
  return new Date(useNowMinute()).toISOString();
}

export function useToasts() {
  return useSyncExternalStore(toasts.subscribe, toasts.get, () => toasts.get());
}

export function useDark() {
  return useSyncExternalStore(
    theme.subscribe,
    () => theme.get().dark,
    () => false,
  );
}
