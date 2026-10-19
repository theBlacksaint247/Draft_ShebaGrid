"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { isOfficer } from "@/lib/people";
import { smoothScrollTo } from "@/lib/smoothScroll";
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
  const [inHow, setInHow] = useState(false);
  const onHow = inHow && pathname === "/";

  // On the home page, "How it works" is the current place while its section is on screen.
  useEffect(() => {
    const section = pathname === "/" ? document.getElementById("how") : null;
    if (!section) return;
    const update = () => {
      const { top, bottom } = section.getBoundingClientRect();
      const line = window.innerHeight * 0.35;
      setInHow(top <= line && bottom > line);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [pathname]);

  function goToHow(e: React.MouseEvent) {
    const section = document.getElementById("how");
    if (pathname !== "/" || !section) return; // Another page: let the link navigate.
    e.preventDefault();
    const offset = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
    smoothScrollTo(section.getBoundingClientRect().top + window.scrollY - offset);
    history.pushState(null, "", "/#how");
    setInHow(true);
  }

  function goToTop(e: React.MouseEvent) {
    if (pathname !== "/") return;
    e.preventDefault();
    smoothScrollTo(0);
    history.pushState(null, "", "/");
  }

  return (
    <nav aria-label="Main" className="order-last w-full sm:order-none sm:w-auto">
      <ul className="-mx-1 flex gap-1 overflow-x-auto">
        {links.map(({ href, label }) => {
          const path = href.split("#")[0];
          const isHow = href.includes("#");
          const active = isHow
            ? onHow
            : !(path === "/" && onHow) &&
              (path === "/" ? pathname === "/" : pathname === path || pathname.startsWith(`${path}/`));
          return (
            <li key={href}>
              <Link
                href={href}
                onClick={isHow ? goToHow : href === "/" ? goToTop : undefined}
                aria-current={active ? (isHow ? "location" : "page") : undefined}
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
