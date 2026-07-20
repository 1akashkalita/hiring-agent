"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import type { RunRecord } from "@/lib/schemas";
import { CATEGORY_KEYS } from "@/lib/schemas";
import { listRuns, renameRun, deleteRun } from "@/lib/store";
import { totalSeries, categorySeries, summaryStats } from "@/lib/trends";
import { CATEGORY_MAX, MAX_TOTAL, statusFor } from "@/lib/scoring";
import { shortDate } from "@/lib/format";
import { TotalChart } from "@/ui/TotalChart";
import { Sparkline } from "@/ui/Sparkline";
import { HistoryTable } from "@/ui/HistoryTable";
import { EmptyState } from "@/ui/EmptyState";
import { Delta } from "@/ui/Delta";
import { ArrowRightIcon } from "@/ui/Icons";
import { fadeUp, MotionState, useReveal, useStagger } from "@/ui/motion";

const LOAD_ERROR = "Could not load your history. Your browser may be blocking local storage.";

export function HistoryScreen() {
  const [runs, setRuns] = useState<RunRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pageMotion = useReveal(true);
  const statsMotion = useStagger(true);
  const categoriesMotion = useStagger();

  const reload = useCallback(async () => {
    try {
      setRuns(await listRuns());
    } catch {
      setError(LOAD_ERROR);
      setRuns([]);
    }
  }, []);

  useEffect(() => { void reload(); }, [reload]);

  const rename = useCallback(async (id: string, label: string) => {
    try { await renameRun(id, label); await reload(); } catch { setError(LOAD_ERROR); }
  }, [reload]);
  const remove = useCallback(async (id: string) => {
    try { await deleteRun(id); await reload(); } catch { setError(LOAD_ERROR); }
  }, [reload]);

  if (error) return <MotionState state="error"><EmptyState message={error} /></MotionState>;
  if (runs === null) return <MotionState state="loading"><p className="empty">Loading history...</p></MotionState>;
  if (!runs.length) {
    return (
      <MotionState state="empty">
        <motion.section className="history-empty" {...pageMotion}>
          <div className="page-kicker">History</div>
          <h1>No history found.</h1>
          <p>Score a resume to begin tracking revisions and category changes over time.</p>
          <Link href="/" className="button-primary">Score a resume <ArrowRightIcon size={16} /></Link>
        </motion.section>
      </MotionState>
    );
  }

  const series = totalSeries(runs);
  const summary = summaryStats(runs);
  const lastDelta = series.length >= 2 ? series.at(-1)!.total - series.at(-2)!.total : null;
  const dateRange = summary.firstAt && summary.lastAt ? `${shortDate(summary.firstAt)} to ${shortDate(summary.lastAt)}` : "";

  return (
    <MotionState state="history">
      <motion.section {...pageMotion}>
      <header className="history-head"><div className="page-kicker">History</div><h1>Your resume, over time.</h1></header>

      <motion.div className="stats-grid" {...statsMotion}>
        <motion.div className="stat-panel" variants={fadeUp}><div className="stat-label">Latest score</div><div className="stat-value">{summary.latest}<small>/{MAX_TOTAL}</small></div><div className="stat-note"><Delta value={lastDelta} suffix="vs. last" /></div></motion.div>
        <motion.div className="stat-panel" variants={fadeUp}><div className="stat-label">Personal best</div><div className="stat-value">{summary.personalBest}<small>/{MAX_TOTAL}</small></div><div className="stat-note">{summary.personalBest === summary.latest ? "Also the latest" : "Across all runs"}</div></motion.div>
        <motion.div className="stat-panel" variants={fadeUp}><div className="stat-label">Net change</div><div className="stat-value"><Delta value={summary.netChange} /></div><div className="stat-note">Since your first run</div></motion.div>
        <motion.div className="stat-panel" variants={fadeUp}><div className="stat-label">Runs</div><div className="stat-value">{summary.runCount}</div><div className="stat-note">{dateRange}</div></motion.div>
      </motion.div>

      <section className="trend-panel">
        <header className="trend-panel-head"><h2>Total score</h2><span>{summary.runCount} {summary.runCount === 1 ? "run" : "runs"} · out of {MAX_TOTAL}</span></header>
        <TotalChart series={series} />
      </section>

      <motion.div className="category-trends" {...categoriesMotion}>
        {CATEGORY_KEYS.map((key) => {
          const values = categorySeries(runs, key);
          const latest = values.at(-1) ?? 0;
          const change = values.length >= 2 ? latest - values.at(-2)! : null;
          return (
            <motion.div className="category-trend" key={key} variants={fadeUp}>
              <div className="category-trend-name">{key.replace(/_/g, " ")}</div>
              <div className="category-trend-score"><strong>{latest}<small>/{CATEGORY_MAX[key]}</small></strong><Delta value={change} /></div>
              <Sparkline values={values} status={statusFor(latest, CATEGORY_MAX[key])} />
            </motion.div>
          );
        })}
      </motion.div>

      <section className="history-section"><div className="eyebrow">Run history</div><HistoryTable runs={runs} onRename={rename} onDelete={remove} /></section>
      </motion.section>
    </MotionState>
  );
}
