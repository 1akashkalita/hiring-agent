"use client";

import { MoonIcon, SunIcon } from "@/ui/Icons";
import { useTheme } from "@/ui/ThemeProvider";
import { motion, useReducedMotion } from "framer-motion";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const reduceMotion = useReducedMotion();
  const indicator = (
    <motion.span
      className="theme-active-indicator"
      data-motion-theme-indicator
      layoutId={reduceMotion ? undefined : "active-theme"}
      transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 440, damping: 34 }}
    />
  );
  return (
    <button
      type="button"
      onClick={toggle}
      role="switch"
      aria-checked={theme === "dark"}
      aria-label="Choose light or dark theme"
      className="theme-switch"
    >
      <span className={`theme-switch-side${theme === "light" ? " is-selected" : ""}`}>
        {theme === "light" && indicator}
        <span className="theme-switch-icon"><SunIcon size={14} /></span>
      </span>
      <span className={`theme-switch-side${theme === "dark" ? " is-selected" : ""}`}>
        {theme === "dark" && indicator}
        <span className="theme-switch-icon"><MoonIcon size={14} /></span>
      </span>
    </button>
  );
}
