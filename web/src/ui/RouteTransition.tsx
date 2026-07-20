"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

const routeTransition = { duration: 0.24, ease: [0.22, 0.61, 0.36, 1] as const };

export function RouteTransition({ routeKey, children }: { routeKey: string; children: React.ReactNode }) {
  const reduceMotion = useReducedMotion();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={routeKey}
        data-motion-route
        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
        transition={reduceMotion ? { duration: 0 } : routeTransition}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
