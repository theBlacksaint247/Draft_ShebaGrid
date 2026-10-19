import { createStore } from "./create-store";

const KEY = "sg-theme";

export const theme = createStore({ dark: false });

function prefersDark(): boolean {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function isDark(): boolean {
  const chosen = document.documentElement.dataset.theme;
  return chosen ? chosen === "dark" : prefersDark();
}

/**
 * The page sets the theme before it paints (see the script in the root layout).
 * This reads the result, and follows the system setting until a choice is made.
 */
export function hydrateTheme(): () => void {
  theme.set({ dark: isDark() });
  const query = window.matchMedia("(prefers-color-scheme: dark)");
  const onChange = () => theme.set({ dark: isDark() });
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

export function setDark(dark: boolean) {
  document.documentElement.dataset.theme = dark ? "dark" : "light";
  try {
    localStorage.setItem(KEY, dark ? "dark" : "light");
  } catch {
    // The choice then lasts until the page is closed.
  }
  theme.set({ dark });
}

/** Runs in the document head before first paint, so there is no flash of the wrong theme. */
export const THEME_INIT_SCRIPT = `try{var t=localStorage.getItem("${KEY}");if(t==="dark"||t==="light")document.documentElement.dataset.theme=t}catch(e){}`;
