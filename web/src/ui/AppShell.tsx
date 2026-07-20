"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { GearIcon } from "@/ui/Icons";
import { PrivacyChip } from "@/ui/PrivacyChip";
import { RouteTransition } from "@/ui/RouteTransition";
import { ThemeToggle } from "@/ui/ThemeToggle";

type Destination = "score" | "history" | "settings";

function destinationFor(pathname: string): Destination {
  if (pathname === "/settings") return "settings";
  if (pathname === "/history" || pathname === "/diff") return "history";
  return "score";
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const active = destinationFor(pathname);
  const reduceMotion = useReducedMotion();
  const indicatorTransition = reduceMotion
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 420, damping: 36 };

  const activeIndicator = (
    <motion.span
      className="nav-active-indicator"
      data-motion-nav-indicator
      layoutId={reduceMotion ? undefined : "active-navigation"}
      transition={indicatorTransition}
    />
  );

  return (
    <div className="app-shell">
      <header className="shell-header">
        <div className="shell-header-inner">
          <Link href="/" className="wordmark" aria-label="Fix My Resume home">
            fix<span>my</span>resume
          </Link>

          <div className="shell-actions">
            <nav className="primary-nav" aria-label="Primary">
              <Link
                href="/"
                className={`nav-link${active === "score" ? " nav-active" : ""}`}
                aria-current={active === "score" ? "page" : undefined}
              >
                {active === "score" && activeIndicator}
                <span className="nav-content">Score</span>
              </Link>
              <Link
                href="/history"
                className={`nav-link${active === "history" ? " nav-active" : ""}`}
                aria-current={active === "history" ? "page" : undefined}
              >
                {active === "history" && activeIndicator}
                <span className="nav-content">History</span>
              </Link>
              <Link
                href="/settings"
                className={`nav-link nav-settings${active === "settings" ? " nav-active" : ""}`}
                aria-current={active === "settings" ? "page" : undefined}
                aria-label="Settings"
                title="Settings"
              >
                {active === "settings" && activeIndicator}
                <span className="nav-content"><GearIcon size={22} /></span>
              </Link>
            </nav>
            <span className="shell-divider" aria-hidden="true" />
            <div className="shell-utilities">
              <ThemeToggle />
              <PrivacyChip />
            </div>
          </div>
        </div>
      </header>
      <main className="shell-main">
        <RouteTransition routeKey={pathname}>{children}</RouteTransition>
      </main>
    </div>
  );
}
