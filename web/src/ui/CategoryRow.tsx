"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { CategoryKey, Evaluation } from "@/lib/schemas";
import { cappedCategory, CATEGORY_MAX, statusFor, statusLabel } from "@/lib/scoring";
import { Delta } from "@/ui/Delta";
import { fadeUp } from "@/ui/motion";

export function CategoryRow({ ckey, ev, delta }: { ckey: CategoryKey; ev: Evaluation; delta: number | null }) {
  const max = CATEGORY_MAX[ckey];
  const score = cappedCategory(ev, ckey);
  const status = statusFor(score, max);
  const reduceMotion = useReducedMotion();

  return (
    <motion.div className="category-row" data-motion-category variants={fadeUp}>
      <div className="category-head">
        <div>
          <div className="category-name">{ckey.replace(/_/g, " ")}</div>
          <div className="category-evidence">{ev.scores[ckey].evidence}</div>
        </div>
        <div className="category-score">
          <span className="category-value">{score}<small>/{max}</small></span>
          <Delta value={delta} />
          <span className={`category-status is-${status}`}>{statusLabel(status)}</span>
        </div>
      </div>
      <div className="category-track">
        <motion.div
          className={`category-fill is-${status}`}
          initial={reduceMotion ? false : { width: 0 }}
          whileInView={{ width: `${Math.round((score / max) * 100)}%` }}
          viewport={{ once: true }}
          transition={{ duration: reduceMotion ? 0 : 0.7, ease: "easeOut" }}
        />
      </div>
    </motion.div>
  );
}
