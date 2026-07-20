"use client";

import type { SeriesPoint } from "@/lib/trends";
import { motion, useReducedMotion } from "framer-motion";
import { buildLinePath } from "@/lib/trends";
import { shortDate } from "@/lib/format";
import { MAX_TOTAL } from "@/lib/scoring";

const WIDTH = 720;
const HEIGHT = 260;
const PADDING = 40;
const GRID = [0, 20, 40, 60, 80, MAX_TOTAL];

export function TotalChart({ series }: { series: SeriesPoint[] }) {
  const reduceMotion = useReducedMotion();
  const values = series.map((point) => point.total);
  const { line, area, points, yFor } = buildLinePath(values, { w: WIDTH, h: HEIGHT, pad: PADDING, maxY: MAX_TOTAL });
  const peak = values.length ? values.indexOf(Math.max(...values)) : -1;
  const labelStep = Math.max(1, Math.ceil(series.length / 6));
  const label = series.length
    ? `Total score over time, from ${values[0]} to ${values[values.length - 1]} out of ${MAX_TOTAL}`
    : "Total score over time with no saved runs";

  return (
    <svg className="trend-chart" viewBox={`0 0 ${WIDTH} ${HEIGHT + 12}`} role="img" aria-label={label}>
      {GRID.map((value) => {
        const y = yFor(value);
        return (
          <g key={value}>
            <line className="chart-gridline" x1={PADDING} y1={y} x2={WIDTH - PADDING} y2={y} />
            <text className="chart-label" x={PADDING - 10} y={y + 4} textAnchor="end">{value}</text>
          </g>
        );
      })}
      {area && <motion.path className="chart-area" data-motion-chart d={area} initial={reduceMotion ? false : { opacity: 0 }} animate={{ opacity: 1, d: area }} transition={{ duration: reduceMotion ? 0 : 0.4 }} />}
      {line && <motion.path className="chart-line" data-motion-chart d={line} initial={reduceMotion ? false : { pathLength: 0 }} animate={{ pathLength: 1, d: line }} transition={{ duration: reduceMotion ? 0 : 0.8, ease: "easeOut" }} />}
      {points.map((point, index) => {
        const showValue = series.length <= 8 || index === 0 || index === series.length - 1 || index === peak;
        const showDate = series.length <= 8 || index % labelStep === 0 || index === series.length - 1;
        return (
          <g key={series[index]?.id ?? index}>
            <motion.circle className="chart-node" cx={point.x} cy={point.y} r="4.5" initial={reduceMotion ? false : { scale: 0 }} animate={{ scale: 1 }} transition={{ duration: reduceMotion ? 0 : 0.2, delay: reduceMotion ? 0 : index * 0.045 }} />
            {showValue && <text className="chart-value" x={point.x} y={point.y - 12} textAnchor="middle">{values[index]}</text>}
            {showDate && <text className="chart-label" x={point.x} y={HEIGHT + 6} textAnchor="middle">{shortDate(series[index].createdAt)}</text>}
          </g>
        );
      })}
    </svg>
  );
}
