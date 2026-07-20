// web/src/ui/Sparkline.tsx
"use client";
import type { Status } from "../lib/scoring";
import { buildSparkPath } from "../lib/trends";
import { motion, useReducedMotion } from "framer-motion";

const W = 220;
const H = 44;

const COLOR: Record<Status, { stroke: string; fill: string }> = {
  good: { stroke: "var(--good)", fill: "var(--good-tint)" },
  warn: { stroke: "var(--warn)", fill: "var(--warn-tint)" },
  bad: { stroke: "var(--bad)", fill: "var(--bad-tint)" },
};

export function Sparkline({ values, status }: { values: number[]; status: Status }) {
  const reduceMotion = useReducedMotion();
  const { line, area } = buildSparkPath(values, { w: W, h: H });
  const c = COLOR[status];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
      {area && <motion.path d={area} fill={c.fill} initial={reduceMotion ? false : { opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: reduceMotion ? 0 : 0.3 }} />}
      {line && (
        <motion.path
          data-motion-chart
          d={line}
          fill="none"
          stroke={c.stroke}
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
          initial={reduceMotion ? false : { pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: reduceMotion ? 0 : 0.55, ease: "easeOut" }}
        />
      )}
    </svg>
  );
}
