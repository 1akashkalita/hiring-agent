import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Familjen_Grotesk } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { AppShell } from "@/ui/AppShell";
import { ThemeProvider } from "@/ui/ThemeProvider";
import { SettingsProvider } from "@/ui/SettingsProvider";

const mainFont = Familjen_Grotesk({
  subsets: ["latin"],
  variable: "--font-main",
  display: "swap",
});

const DESCRIPTION =
  "Score a resume PDF against an explainable 100-point rubric, get prioritized coaching, and track revisions. PDF text is extracted locally and sent directly from your browser to Google Gemini.";

export const metadata: Metadata = {
  metadataBase: new URL("https://fixmyresume.dev"),
  title: "fixmyresume",
  description: DESCRIPTION,
  applicationName: "fixmyresume",
  openGraph: {
    type: "website",
    url: "https://fixmyresume.dev",
    siteName: "Fix My Resume",
    title: "Fix My Resume — an honest, in-browser resume score",
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: "Fix My Resume — an honest, in-browser resume score",
    description:
      "An explainable 100-point resume score with prioritized coaching and local revision history.",
  },
};

export const viewport: Viewport = {
  themeColor: "#F7F9F6",
};

// Set the theme before paint so there is no flash. Light is the first-visit
// default; once the user chooses a theme, that explicit preference wins.
const themeBootstrap = `(function(){try{var t=localStorage.getItem('ha-theme');document.documentElement.setAttribute('data-theme',t==='dark'?'dark':'light');}catch(e){document.documentElement.setAttribute('data-theme','light');}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={mainFont.variable}>
      <head><script dangerouslySetInnerHTML={{ __html: themeBootstrap }} /></head>
      <body>
        <ThemeProvider>
          <SettingsProvider>
            <AppShell>{children}</AppShell>
          </SettingsProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
