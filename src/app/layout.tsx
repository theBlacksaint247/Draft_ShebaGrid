import type { Metadata } from "next";
import "@fontsource/barlow/400.css";
import "@fontsource/barlow/500.css";
import "@fontsource/barlow/600.css";
import "@fontsource/barlow/700.css";
import "@fontsource/barlow-semi-condensed/600.css";
import "@fontsource/barlow-semi-condensed/700.css";
// Hind Siliguri supplies the Bangla letters; the browser only downloads the
// parts of each font that a page actually uses.
import "@fontsource/hind-siliguri/400.css";
import "@fontsource/hind-siliguri/500.css";
import "@fontsource/hind-siliguri/600.css";
import "@fontsource/hind-siliguri/700.css";
import "./globals.css";
import { SiteFooter } from "@/components/SiteFooter";
import { DemoLayer } from "@/components/shell/DemoLayer";
import { SiteHeader } from "@/components/shell/SiteHeader";
import { THEME_INIT_SCRIPT } from "@/lib/store/theme";

export const metadata: Metadata = {
  title: {
    default: "Shebagrid (সেবাগ্রিড)",
    template: "%s | Shebagrid",
  },
  description:
    "Report potholes and road hazards to your city corporation, track the fix, and help officials find the places that keep going wrong. Built for DNCC and DSCC.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // The theme attribute is set by the script below before the page paints.
    <html lang="en" className="h-full" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="flex min-h-full flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-ui focus:bg-brand focus:px-4 focus:py-2 focus:text-white"
        >
          Skip to content
        </a>
        <SiteHeader />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter />
        <DemoLayer />
      </body>
    </html>
  );
}
