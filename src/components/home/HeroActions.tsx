"use client";

import Link from "next/link";
import { isOfficer } from "@/lib/people";
import { useSession } from "@/lib/store/hooks";

const primary =
  "rounded-ui bg-brand px-6 py-3 text-lg font-semibold text-white hover:bg-brand-deep";
const secondary =
  "rounded-ui border-2 border-ink px-6 py-[10px] text-lg font-semibold hover:bg-ink hover:text-paper";

/** The buttons under the headline change with who is signed in. */
export function HeroActions() {
  const { role } = useSession();

  if (role && isOfficer(role)) {
    return (
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/dashboard" className={primary}>Open the dashboard</Link>
        <Link href="/hotspots" className={secondary}>Hotspot map</Link>
      </div>
    );
  }
  if (role === "resident") {
    return (
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/report" className={primary}>Report a problem</Link>
        <Link href="/complaints" className={secondary}>My complaints</Link>
      </div>
    );
  }
  return (
    <div className="mt-6 flex flex-wrap gap-3">
      <Link href="/login?next=/report" className={primary}>Report a problem</Link>
      <Link href="/login" className={secondary}>Sign in</Link>
    </div>
  );
}
