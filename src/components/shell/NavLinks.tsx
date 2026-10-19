"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isOfficer } from "@/lib/people";
import type { Role } from "@/lib/types";

const GUEST = [
  { href: "/", label: "Map" },
  { href: "/#how", label: "How it works" },
];

const RESIDENT = [
  { href: "/", label: "Map" },
  { href: "/report", label: "Report a problem" },
  { href: "/complaints", label: "My complaints" },
];

const OFFICER = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/hotspots", label: "Hotspots" },
  { href: "/", label: "Map" },
];

export function NavLinks({ role }: { role: Role | null }) {
  const pathname = usePathname();
  const links = role === null ? GUEST : isOfficer(role) ? OFFICER : RESIDENT;
  return (
    <nav aria-label="Main" className="order-last w-full sm:order-none sm:w-auto">
      <ul className="-mx-1 flex gap-1 overflow-x-auto">
        {links.map(({ href, label }) => {
          const path = href.split("#")[0];
          const active = !href.includes("#") && (path === "/" ? pathname === "/" : pathname === path || pathname.startsWith(`${path}/`));
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`block whitespace-nowrap border-b-[3px] px-2.5 py-2 font-medium ${
                  active
                    ? "border-survey text-on-road"
                    : "border-transparent text-on-road/70 hover:text-on-road"
                }`}
              >
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
