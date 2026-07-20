"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import type { RunRecord } from "@/lib/schemas";
import { CATEGORY_KEYS } from "@/lib/schemas";
import { computeTotal, cappedCategory, CATEGORY_MAX, MAX_TOTAL } from "@/lib/scoring";
import { diffRuns } from "@/lib/diff";
import { getRun } from "@/lib/store";
import { shortDate } from "@/lib/format";
import { EmptyState } from "@/ui/EmptyState";
import { Delta } from "@/ui/Delta";
import { fadeUp, MotionState, useReveal, useStagger } from "@/ui/motion";

export function DiffScreen() {
  const params = useSearchParams();
  const aId = params.get("a");
  const bId = params.get("b");
  const [loading, setLoading] = useState(true);
  const [a, setA] = useState<RunRecord | null>(null);
  const [b, setB] = useState<RunRecord | null>(null);
  const pageMotion = useReveal(true);
  const totalsMotion = useStagger(true);
  const rowsMotion = useStagger(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const [first, second] = await Promise.all([
        aId ? getRun(aId) : Promise.resolve(undefined),
        bId ? getRun(bId) : Promise.resolve(undefined),
      ]);
      if (!cancelled) { setA(first ?? null); setB(second ?? null); setLoading(false); }
    }
    void load();
    return () => { cancelled = true; };
  }, [aId, bId]);

  if (loading) return <MotionState state="loading"><p className="empty">Loading comparison...</p></MotionState>;
  if (!a || !b) return <MotionState state="missing"><EmptyState message="Both runs are needed to compare. One could not be found." /></MotionState>;

  const difference = diffRuns(a, b);
  const aLabel = a.label || a.fileName;
  const bLabel = b.label || b.fileName;
  const aIsNewer = a.createdAt >= b.createdAt;

  return (
    <MotionState state={`${a.id}:${b.id}`}>
      <motion.section className="diff-page" {...pageMotion}>
      <div className="page-kicker">Compare revisions</div>
      <h1>{aLabel} <span>vs.</span> {bLabel}</h1>
      <motion.div className="diff-totals" {...totalsMotion}>
        <motion.div className="diff-total" variants={fadeUp}>
          <div className="diff-total-label">{aLabel} <span className={`diff-tag${aIsNewer ? " is-new" : ""}`}>{aIsNewer ? "newer" : "older"}</span></div>
          <div className="diff-value">{computeTotal(a.evaluation)}<small>/{MAX_TOTAL}</small></div>
          <div className="diff-date">{shortDate(a.createdAt)}</div>
        </motion.div>
        <motion.div className="diff-total" variants={fadeUp}>
          <div className="diff-total-label">{bLabel} <span className={`diff-tag${!aIsNewer ? " is-new" : ""}`}>{aIsNewer ? "older" : "newer"}</span></div>
          <div className="diff-value">{computeTotal(b.evaluation)}<small>/{MAX_TOTAL}</small></div>
          <div className="diff-date">{shortDate(b.createdAt)}</div>
        </motion.div>
        <motion.div className="diff-total" variants={fadeUp}><div className="diff-total-label">Total change</div><div className="diff-value"><Delta value={difference.total} /></div></motion.div>
      </motion.div>
      <motion.div className="diff-rows" {...rowsMotion}>
        {CATEGORY_KEYS.map((key) => (
          <motion.div className="diff-row" key={key} variants={fadeUp}>
            <span className="diff-name">{key.replace(/_/g, " ")}</span>
            <span className="diff-score">{cappedCategory(a.evaluation, key)}/{CATEGORY_MAX[key]}</span>
            <span className="diff-score is-muted">{cappedCategory(b.evaluation, key)}/{CATEGORY_MAX[key]}</span>
            <Delta value={difference.byCategory[key]} />
          </motion.div>
        ))}
      </motion.div>
      </motion.section>
    </MotionState>
  );
}
