import { STATUS_LABEL } from "@/lib/sla";
import type { Status } from "@/lib/types";

const STAGES: Status[] = ["open", "assigned", "in-progress", "resolved", "verified"];

/** Five painted dashes, filled up to where the ticket has got to. */
export function ProgressStripe({ status }: { status: Status }) {
  const escalated = status === "escalated";
  // An escalated ticket is being worked on, so it sits at the third stage.
  const at = escalated ? 2 : STAGES.indexOf(status);
  return (
    <div role="img" aria-label={`Stage ${at + 1} of 5: ${STATUS_LABEL[status]}`} className="flex gap-1">
      {STAGES.map((stage, i) => (
        <span
          key={stage}
          className={`h-1.5 w-7 rounded-full ${
            escalated && i === at ? "bg-signal" : i <= at ? "bg-brand-ink" : "bg-line"
          }`}
        />
      ))}
    </div>
  );
}
