"use client";

import Link from "next/link";
import { Wordmark } from "@/components/Wordmark";
import { useSession } from "@/lib/store/hooks";
import { AccountMenu } from "./AccountMenu";
import { NavLinks } from "./NavLinks";
import { ThemeToggle } from "./ThemeToggle";

export function SiteHeader() {
  const { hydrated, role } = useSession();

  return (
    <header className="bg-road text-on-road">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-1 px-4 py-2.5 sm:px-6">
        <Link href="/" aria-label="Shebagrid home">
          <Wordmark onRoad />
        </Link>
        <NavLinks role={role} />
        <div className="ml-auto flex items-center gap-1.5">
          <ThemeToggle />
          {!hydrated ? (
            <span aria-hidden="true" className="ml-1 h-9 w-28 rounded-full bg-on-road/10" />
          ) : role ? (
            <AccountMenu role={role} />
          ) : (
            <>
              <Link
                href="/login"
                className="ml-1 hidden rounded-ui px-3 py-2 font-medium text-on-road/80 hover:text-on-road sm:block"
              >
                Sign in
              </Link>
              <Link
                href="/login?next=/report"
                className="rounded-ui bg-survey px-4 py-2 font-semibold text-road hover:brightness-95"
              >
                Report a problem
              </Link>
            </>
          )}
          {hydrated && role === "resident" && (
            <Link
              href="/report"
              className="ml-1 hidden rounded-ui bg-survey px-4 py-2 font-semibold text-road hover:brightness-95 md:block"
            >
              Report a problem
            </Link>
          )}
        </div>
      </div>
      <div aria-hidden="true" className="lane-line opacity-90" />
    </header>
  );
}
