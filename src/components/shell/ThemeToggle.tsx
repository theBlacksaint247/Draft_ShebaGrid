"use client";

import { useDark } from "@/lib/store/hooks";
import { setDark } from "@/lib/store/theme";
import { MoonIcon, SunIcon } from "@/components/ui/icons";

/** Switches between the light and dark themes. It shows the icon of the theme you would get. */
export function ThemeToggle() {
  const dark = useDark();
  return (
    <button
      type="button"
      onClick={() => setDark(!dark)}
      aria-pressed={dark}
      aria-label="Dark theme"
      title={dark ? "Switch to the light theme" : "Switch to the dark theme"}
      className="grid h-10 w-10 place-items-center rounded-full text-on-road/80 hover:bg-on-road/10 hover:text-on-road"
    >
      <MoonIcon className="icon-moon" />
      <SunIcon className="icon-sun" />
    </button>
  );
}
