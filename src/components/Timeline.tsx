import { formatDateTime } from "@/lib/format";
import { STATUS_LABEL } from "@/lib/sla";
import { timelineRows } from "@/lib/timeline";
import type { StatusEvent } from "@/lib/types";
import { StatusMark } from "./marks";

export function Timeline({ history }: { history: StatusEvent[] }) {
  const rows = timelineRows(history);
  const current = history.length - 1;

  return (
    <ol className="relative">
      {rows.map(({ status, at }, i) => (
        <li key={`${status}-${i}`} className="relative flex gap-3 pb-5 last:pb-0">
          {i < rows.length - 1 && (
            <span
              aria-hidden="true"
              className={`absolute left-[9px] top-6 h-[calc(100%-1.25rem)] w-0.5 ${
                i < current ? "bg-brand" : "bg-line"
              }`}
            />
          )}
          <span className="relative z-10 mt-0.5 grid h-5 w-5 shrink-0 place-items-center bg-paper">
            {at ? (
              <StatusMark status={status} size={18} />
            ) : (
              <span className="h-3.5 w-3.5 rounded-full border-2 border-line" />
            )}
          </span>
          <div className={at ? "" : "text-muted"}>
            <p className={`font-semibold ${i === current ? "text-ink" : ""}`}>
              {STATUS_LABEL[status]}
              {at && (
                <span className="ml-2 text-sm font-normal text-muted tabular-nums">
                  {formatDateTime(at)}
                </span>
              )}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
