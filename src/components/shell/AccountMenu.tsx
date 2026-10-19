"use client";

import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import { ChevronIcon } from "@/components/ui/icons";
import { useDismiss } from "@/components/ui/useDismiss";
import { PERSONAS, ROLE_LABEL } from "@/lib/people";
import { signOut } from "@/lib/store/session";
import type { Role } from "@/lib/types";

export function AccountMenu({ role }: { role: Role }) {
  const persona = PERSONAS[role];
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(open, close, box);

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 text-on-road hover:bg-on-road/10"
      >
        <span
          aria-hidden="true"
          className="grid h-8 w-8 place-items-center rounded-full bg-survey font-display text-sm font-bold text-road"
        >
          {persona.initials}
        </span>
        <span className="hidden text-left leading-tight lg:block">
          <span className="block text-sm font-semibold">{persona.name}</span>
          <span className="block text-xs text-on-road/70">{ROLE_LABEL[role]}</span>
        </span>
        <span className="sr-only lg:hidden">{persona.name}, account menu</span>
        <ChevronIcon size={16} className="text-on-road/70" />
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-64 rounded-ui border border-line bg-panel p-1 text-ink shadow-lift">
          <div className="px-3 py-2.5">
            <p className="font-semibold">{persona.name}</p>
            <p className="text-sm text-muted">{persona.title}, {persona.corporation}</p>
          </div>
          <div className="border-t border-line pt-1">
            <Link
              href="/login"
              onClick={close}
              className="block rounded-ui px-3 py-2 hover:bg-wash"
            >
              Switch account
            </Link>
            <button
              type="button"
              onClick={() => {
                signOut();
                close();
              }}
              className="block w-full rounded-ui px-3 py-2 text-left hover:bg-wash"
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
