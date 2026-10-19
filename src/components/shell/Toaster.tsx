"use client";

import { CloseIcon } from "@/components/ui/icons";
import { useToasts } from "@/lib/store/hooks";
import { dismissToast, type ToastTone } from "@/lib/store/toasts";

const EDGE: Record<ToastTone, string> = {
  info: "border-l-on-road/40",
  success: "border-l-brand-ink",
  alert: "border-l-survey",
};

/** Short messages that confirm what just happened, some with an Undo button. */
export function Toaster() {
  const toasts = useToasts();
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col items-end gap-2 sm:inset-x-auto sm:right-4"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast-in pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-ui border-l-4 bg-road py-3 pl-4 pr-2 text-on-road shadow-lift ${EDGE[toast.tone]}`}
        >
          <p className="flex-1 leading-snug">{toast.text}</p>
          {toast.action && (
            <button
              type="button"
              onClick={() => {
                toast.action?.run();
                dismissToast(toast.id);
              }}
              className="rounded-ui px-2 py-0.5 font-semibold text-survey hover:bg-on-road/10"
            >
              {toast.action.label}
            </button>
          )}
          <button
            type="button"
            aria-label="Dismiss"
            onClick={() => dismissToast(toast.id)}
            className="grid h-7 w-7 place-items-center rounded-full text-on-road/70 hover:bg-on-road/10"
          >
            <CloseIcon size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
