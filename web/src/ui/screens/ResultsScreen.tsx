"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import type { RunRecord } from "@/lib/schemas";
import { CATEGORY_KEYS } from "@/lib/schemas";
import { computeTotal, cappedCategory, MAX_TOTAL } from "@/lib/scoring";
import { diffRuns } from "@/lib/diff";
import { totalSeries, buildSparkPath } from "@/lib/trends";
import { geminiModelLabel } from "@/lib/gemini";
import { getRun, listRuns } from "@/lib/store";
import { CategoryRow } from "@/ui/CategoryRow";
import { RevisionRail } from "@/ui/RevisionRail";
import { CoachSection } from "@/ui/CoachSection";
import { EmptyState } from "@/ui/EmptyState";
import { Delta } from "@/ui/Delta";
import { SparkIcon } from "@/ui/Icons";
import { fadeUp, MotionState, useReveal, useStagger } from "@/ui/motion";

export function ResultsScreen() {
  const params = useSearchParams();
  const id = params.get("run");
  const [loading, setLoading] = useState(true);
  const [run, setRun] = useState<RunRecord | null>(null);
  const [previous, setPrevious] = useState<RunRecord | null>(null);
  const [runs, setRuns] = useState<RunRecord[]>([]);
  const reduceMotion = useReducedMotion();
  const reportMotion = useStagger(true);
  const scoreMotion = useReveal(true);
  const categoriesMotion = useStagger(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      if (!id) {
        if (!cancelled) { setRun(null); setPrevious(null); setRuns([]); setLoading(false); }
        return;
      }
      const [current, all] = await Promise.all([getRun(id), listRuns()]);
      if (cancelled) return;
      const index = current ? all.findIndex((item) => item.id === current.id) : -1;
      setRun(current ?? null);
      setPrevious(index > 0 ? all[index - 1] : null);
      setRuns(all);
      setLoading(false);
    }
    void load();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) return <MotionState state="loading"><p className="empty">Loading score report...</p></MotionState>;
  if (!run) return <MotionState state="missing"><EmptyState message="That score report could not be found." /></MotionState>;

  const difference = diffRuns(run, previous);
  const total = computeTotal(run.evaluation);
  const categoryTotal = CATEGORY_KEYS.reduce((sum, key) => sum + cappedCategory(run.evaluation, key), 0);
  const modelLabel = geminiModelLabel(run.model);
  const series = totalSeries(runs);
  const currentIndex = series.findIndex((point) => point.id === run.id);
  const sparkValues = (currentIndex >= 0 ? series.slice(0, currentIndex + 1) : series).map((point) => point.total);
  const spark = buildSparkPath(sparkValues, { w: 320, h: 64 });

  return (
    <MotionState state={run.id}>
      <motion.div className="report-layout" data-motion-report {...reportMotion}>
        <RevisionRail runs={runs} currentId={run.id} />
        <motion.article className="report-main" variants={fadeUp}>
        <header className="report-heading">
          <div className="eyebrow">Score report · {run.label || run.fileName}</div>
          <h1>{run.coach.verdict}</h1>
        </header>

        <motion.section className="score-card scorebar" data-motion-score-card aria-label={`Total score ${total} out of ${MAX_TOTAL}`} {...scoreMotion}>
          <div className="score-total total">{total}<small>/{MAX_TOTAL}</small></div>
          <div className="score-delta">
            <span className="score-delta-label">{previous ? `vs. ${previous.label || previous.fileName}` : "first run"}</span>
            <Delta value={difference.total} />
          </div>
          <div className="score-spark" aria-hidden="true">
            {sparkValues.length >= 2 && (
              <svg viewBox="0 0 320 64" preserveAspectRatio="none">
                <motion.path d={spark.area} fill="var(--mint)" initial={reduceMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: reduceMotion ? 0 : 0.35 }} />
                <motion.path d={spark.line} fill="none" stroke="var(--forest)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" initial={reduceMotion ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: reduceMotion ? 0 : 0.65, ease: "easeOut" }} />
              </svg>
            )}
          </div>
        </motion.section>

        <motion.section className="category-list cats" aria-label="Score categories" {...categoriesMotion}>
          {CATEGORY_KEYS.map((key) => <CategoryRow key={key} ckey={key} ev={run.evaluation} delta={difference.byCategory[key]} />)}
        </motion.section>

        <div className="score-summary">
          <span>categories <strong>{categoryTotal}</strong>/{MAX_TOTAL}</span>
          <span className="bonus">+ bonus {run.evaluation.bonus_points.total}</span>
          <span className="deduction">- deductions {run.evaluation.deductions.total}</span>
          <span className="fairness">blind to name · gender · school · GPA · location</span>
        </div>

        <CoachSection coach={run.coach} evaluation={run.evaluation} />

        <footer className="report-footer">
          <Link href="/settings" className="model-used">
            <SparkIcon size={14} /> Scored with {modelLabel ?? "model not recorded"}
          </Link>
        </footer>
        </motion.article>
      </motion.div>
    </MotionState>
  );
}
