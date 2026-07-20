"use client";

import type { Coach, Evaluation } from "@/lib/schemas";
import { motion } from "framer-motion";
import { cappedCategory, CATEGORY_MAX, statusFor } from "@/lib/scoring";
import { Delta } from "@/ui/Delta";
import { fadeUp, useStagger } from "@/ui/motion";

const ACCENT = { good: "var(--success)", warn: "var(--warning)", bad: "var(--danger)" } as const;

export function CoachSection({ coach, evaluation }: { coach: Coach; evaluation: Evaluation }) {
  const fixesMotion = useStagger();
  const boostsMotion = useStagger();

  return (
    <motion.section className="coach-section" {...fixesMotion}>
      <div className="eyebrow">What to fix next</div>
      <h2 className="coach-title">{coach.fixes.length ? "Biggest score left on the table" : "Nothing urgent to fix"}</h2>
      <p className="coach-note">{coach.fixes.length ? "High-impact changes, in priority order." : "This resume is already strong across the rubric."}</p>

      {coach.fixes.map((fix, index) => {
        const status = statusFor(cappedCategory(evaluation, fix.category), CATEGORY_MAX[fix.category]);
        return (
          <motion.article className="coach-fix" key={index} variants={fadeUp} style={{ ["--coach-accent" as string]: ACCENT[status] }}>
            <span className="coach-rule" />
            <div>
              <div className="coach-meta">Priority {String(fix.priority).padStart(2, "0")} · improves <strong>{fix.category.replace(/_/g, " ")}</strong></div>
              <h3>{fix.title}</h3>
              <p>{fix.detail}</p>
            </div>
            <Delta value={fix.estGain} />
          </motion.article>
        );
      })}

      {coach.boosts.length > 0 && (
        <motion.div className="coach-boosts" {...boostsMotion}>
          <h2 className="coach-title">Small boosts</h2>
          <p className="coach-note">Polish for categories that are already strong.</p>
          {coach.boosts.map((boost, index) => (
            <motion.div className="coach-boost" key={index} variants={fadeUp}>
              <span className="coach-boost-tag">{boost.category.replace(/_/g, " ")}</span>
              <span className="coach-boost-copy">{boost.text}</span>
              <Delta value={boost.estGain} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.section>
  );
}
