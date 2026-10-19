"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { PERSONAS, ROLE_LABEL } from "@/lib/people";
import { useSession } from "@/lib/store/hooks";
import type { Role } from "@/lib/types";

interface Props {
  /** Who may see this page. */
  allow: Role[];
  /** What the page is, used in the messages: "your complaints". */
  subject: string;
  children: ReactNode;
}

function Skeleton() {
  return (
    <div aria-busy="true" aria-label="Checking who you are" className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="skeleton h-12 w-72" />
      <div className="skeleton mt-4 h-5 w-96 max-w-full" />
      <div className="mt-10 space-y-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-16" />
        ))}
      </div>
    </div>
  );
}

/**
 * Keeps a page for the people it is meant for. The check runs in the browser
 * against the demo session, so it shows the role rules but is not security. The
 * final system checks on the server.
 */
export function RoleGate({ allow, subject, children }: Props) {
  const { hydrated, role } = useSession();
  const pathname = usePathname();
  const next = encodeURIComponent(pathname);

  if (!hydrated) return <Skeleton />;
  if (role && allow.includes(role)) return <>{children}</>;

  const audience = allow.includes("resident") ? "residents" : "engineers and officials";

  return (
    <div className="mx-auto max-w-xl px-4 py-16 sm:px-6">
      <div className="border-l-[6px] border-survey bg-panel p-6 shadow-lift sm:p-8">
        <h1 className="text-3xl font-bold sm:text-4xl">
          {role ? `This page is for ${audience}` : `Sign in to see ${subject}`}
        </h1>
        <p className="mt-3 text-lg text-muted">
          {role
            ? `You are signed in as ${PERSONAS[role].name}, ${ROLE_LABEL[role].toLowerCase()}.`
            : `${subject.charAt(0).toUpperCase()}${subject.slice(1)} is for signed-in ${audience}.`}
        </p>
        <Link
          href={`/login?next=${next}`}
          className="mt-6 inline-block rounded-ui bg-brand px-6 py-3 text-lg font-semibold text-white hover:bg-brand-deep"
        >
          {role ? "Switch account" : "Sign in"}
        </Link>
      </div>
    </div>
  );
}
