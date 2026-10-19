import { createStore } from "./create-store";

export type ToastTone = "info" | "success" | "alert";

export interface Toast {
  id: number;
  text: string;
  tone: ToastTone;
  action?: { label: string; run: () => void };
}

export const toasts = createStore<Toast[]>([]);

let counter = 0;

const MAX_VISIBLE = 4;
const LIFETIME_MS = 7000;

export function pushToast(toast: Omit<Toast, "id">) {
  const id = ++counter;
  toasts.set((all) => [...all, { ...toast, id }].slice(-MAX_VISIBLE));
  window.setTimeout(() => dismissToast(id), LIFETIME_MS);
  return id;
}

export function dismissToast(id: number) {
  toasts.set((all) => all.filter((t) => t.id !== id));
}
