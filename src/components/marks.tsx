import type { RiskLevel, Status } from "@/lib/types";

/**
 * Small painted marks, like the rings road crews spray around a pothole.
 * Each one differs in shape as well as colour, so none of them rely on colour alone.
 */
export function RiskRing({
  level,
  size = 20,
}: {
  level: RiskLevel;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="shrink-0"
    >
      {level === "high" && (
        <circle cx="12" cy="12" r="8.5" strokeWidth="4" className="stroke-signal" />
      )}
      {level === "medium" && (
        <circle
          cx="12"
          cy="12"
          r="8.5"
          strokeWidth="3.4"
          strokeDasharray="5.2 3.3"
          className="stroke-survey"
        />
      )}
      {level === "low" && (
        <circle cx="12" cy="12" r="8.5" strokeWidth="1.8" className="stroke-brand-ink" />
      )}
    </svg>
  );
}

export const RISK_LABEL: Record<RiskLevel, string> = {
  high: "High risk",
  medium: "Medium risk",
  low: "Low risk",
};

export function StatusMark({
  status,
  size = 16,
}: {
  status: Status;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className="shrink-0"
    >
      {status === "open" && (
        <circle
          cx="8"
          cy="8"
          r="6"
          strokeWidth="1.8"
          strokeDasharray="3 2.4"
          className="stroke-muted"
        />
      )}
      {status === "assigned" && (
        <>
          <circle cx="8" cy="8" r="6" strokeWidth="1.8" className="stroke-brand-ink" />
          <circle cx="8" cy="8" r="2" className="fill-brand-ink" />
        </>
      )}
      {status === "in-progress" && (
        <>
          <circle cx="8" cy="8" r="6" strokeWidth="1.8" className="stroke-brand-ink" />
          <path d="M8 2a6 6 0 0 1 0 12z" className="fill-brand-ink" />
        </>
      )}
      {(status === "resolved" || status === "verified") && (
        <>
          <circle cx="8" cy="8" r="7" className="fill-panel" />
          <circle cx="8" cy="8" r="6.2" className="fill-brand" />
          <path
            d="M5 8.2l2.1 2.1L11 6"
            stroke="white"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {status === "verified" && (
            <circle cx="8" cy="8" r="7.3" strokeWidth="1" className="stroke-panel" />
          )}
        </>
      )}
      {status === "escalated" && (
        <>
          <path d="M8 1.6L15 14H1z" strokeLinejoin="round" className="fill-signal" />
          <path d="M8 6v4" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
          <circle cx="8" cy="11.9" r="0.9" fill="white" />
        </>
      )}
    </svg>
  );
}
