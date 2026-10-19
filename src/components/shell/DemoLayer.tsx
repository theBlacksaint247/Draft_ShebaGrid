"use client";

import { useEffect } from "react";
import { startDemo } from "@/lib/store/demo";
import { hydrateSession } from "@/lib/store/session";
import { hydrateTheme } from "@/lib/store/theme";
import { Toaster } from "./Toaster";

/** Loads the saved data, theme and session in the browser, and shows the toasts. */
export function DemoLayer() {
  useEffect(() => {
    // The demo data loads before the session says it is ready, so a page never
    // shows a complaint as missing while the saved ones are still being read.
    const stops = [startDemo(), hydrateTheme(), hydrateSession()];
    return () => stops.forEach((stop) => stop());
  }, []);

  return <Toaster />;
}
