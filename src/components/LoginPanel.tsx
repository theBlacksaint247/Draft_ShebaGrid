"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { PERSONAS, ROLES, canOpen, roleHome } from "@/lib/people";
import { useSession } from "@/lib/store/hooks";
import { signIn, signOut } from "@/lib/store/session";
import type { Role } from "@/lib/types";

/** Only follow ?next= when it is a page on this site that the person may open. */
function destination(next: string | null, role: Role): string {
  if (next && next.startsWith("/") && !next.startsWith("//") && canOpen(role, next)) {
    return next;
  }
  return roleHome(role);
}

export function LoginPanel() {
  const router = useRouter();
  const next = useSearchParams().get("next");
  const { role: current } = useSession();

  return (
    <div className="mt-10 grid gap-10 md:grid-cols-[1fr_1.25fr]">
      <section aria-labelledby="google">
        <h2 id="google" className="text-2xl font-bold">Google account</h2>
        <button
          type="button"
          disabled
          className="mt-4 flex w-full items-center justify-center rounded-ui border-2 border-ink/50 bg-panel px-5 py-3 text-lg font-semibold opacity-60"
        >
          Continue with Google
        </button>
      </section>

      <section aria-labelledby="demo">
        <h2 id="demo" className="text-2xl font-bold">Demo accounts</h2>
        <ul className="mt-4 space-y-3">
          {ROLES.map((role) => {
            const persona = PERSONAS[role];
            const active = current === role;
            return (
              <li key={role}>
                <button
                  type="button"
                  onClick={() => {
                    signIn(role);
                    router.push(destination(next, role));
                  }}
                  className={`flex w-full items-center gap-4 rounded-ui border-2 p-4 text-left transition-colors ${
                    active
                      ? "border-brand bg-brand-soft"
                      : "border-line bg-panel hover:border-ink/50"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-road font-display text-lg font-bold text-survey"
                  >
                    {persona.initials}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-lg font-semibold">
                      {persona.name}
                      {active && (
                        <span className="ml-2 text-sm font-medium text-brand-ink">Signed in</span>
                      )}
                    </span>
                    <span className="block text-muted">
                      {persona.title}, {persona.corporation}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        {current && (
          <button
            type="button"
            onClick={signOut}
            className="mt-4 rounded-ui border-2 border-ink px-4 py-2 font-semibold hover:bg-ink hover:text-paper"
          >
            Sign out
          </button>
        )}
      </section>
    </div>
  );
}
