import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-line bg-panel">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.4fr_1fr]">
        <div className="max-w-prose space-y-2 text-sm text-muted">
          <p>
            Map data from{" "}
            <a
              className="font-medium text-brand-ink underline underline-offset-2"
              href="https://www.openstreetmap.org/copyright"
            >
              OpenStreetMap contributors
            </a>
            .
          </p>
        </div>
        <ul className="flex flex-wrap gap-x-6 gap-y-1.5 self-start text-sm md:justify-end">
          <li>
            <Link className="hover:underline" href="/">Map</Link>
          </li>
          <li>
            <Link className="hover:underline" href="/report">Report a problem</Link>
          </li>
          <li>
            <Link className="hover:underline" href="/login">Sign in</Link>
          </li>
        </ul>
      </div>
    </footer>
  );
}
