import type { Urgency } from "@/lib/types";

/** Five bars, filled up to the urgency. The number is always written out too. */
export function UrgencyMeter({ value }: { value: Urgency }) {
  return (
    <span
      className="inline-flex items-center gap-2"
      role="img"
      aria-label={`Urgency ${value} of 5`}
    >
      <span className="flex items-end gap-0.5" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((n) => (
          <span
            key={n}
            style={{ height: 6 + n * 2 }}
            className={`w-1.5 rounded-[1px] ${
              n <= value ? (value >= 4 ? "bg-signal" : "bg-ink") : "bg-line"
            }`}
          />
        ))}
      </span>
      <span className="text-sm font-semibold tabular-nums" aria-hidden="true">
        {value}/5
      </span>
    </span>
  );
}
