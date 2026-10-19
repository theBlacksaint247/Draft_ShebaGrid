import { STATUS_LABEL } from "@/lib/sla";
import type { Status } from "@/lib/types";
import { StatusMark } from "./marks";

const TONE: Record<Status, string> = {
  open: "bg-wash text-ink border-line",
  assigned: "bg-brand-soft text-brand-ink border-brand-soft",
  "in-progress": "bg-brand-soft text-brand-ink border-brand-soft",
  resolved: "bg-brand text-white border-brand",
  verified: "bg-brand-deep text-white border-brand-deep",
  escalated: "bg-signal-soft text-signal-ink border-signal-soft",
};

export function StatusChip({ status }: { status: Status }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-sm font-medium ${TONE[status]}`}
    >
      <StatusMark status={status} size={14} />
      {STATUS_LABEL[status]}
    </span>
  );
}
