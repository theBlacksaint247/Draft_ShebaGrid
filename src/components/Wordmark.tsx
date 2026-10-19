/** The logo: a hand-painted ring with the Bangla name beside the Latin one. */
export function Wordmark({ onRoad = false }: { onRoad?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <svg width="30" height="30" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <path
          d="M16 3.5c7.2-.4 12.6 5.2 12.4 12.3-.2 7.3-5.6 12.9-12.7 12.7C8.7 28.3 3.4 22.9 3.6 15.9 3.8 8.8 9.2 3.9 16 3.5z"
          strokeWidth="4.4"
          strokeLinecap="round"
          className="stroke-signal"
        />
        <circle cx="16" cy="16" r="3" className={onRoad ? "fill-survey" : "fill-brand"} />
      </svg>
      <span className="leading-none">
        <span
          lang="bn"
          className={`block text-[1.35rem] font-bold ${onRoad ? "text-on-road" : "text-ink"}`}
        >
          সেবাগ্রিড
        </span>
        <span
          className={`mt-0.5 block font-display text-[0.8rem] font-semibold tracking-wide ${
            onRoad ? "text-on-road/70" : "text-muted"
          }`}
        >
          Shebagrid
        </span>
      </span>
    </span>
  );
}
