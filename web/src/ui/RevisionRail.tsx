"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { RunRecord } from "@/lib/schemas";
import { computeTotal, MAX_TOTAL } from "@/lib/scoring";
import { Delta } from "@/ui/Delta";
import { fadeUp, useStagger } from "@/ui/motion";

function formatDate(timestamp: number) {
  const date = new Date(timestamp);
  const day = date.toDateString() === new Date().toDateString()
    ? "today"
    : date.toLocaleDateString(undefined, { month: "short", day: "2-digit" });
  return `${day} · ${date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", hour12: false })}`;
}

export function RevisionRail({ runs, currentId }: { runs: RunRecord[]; currentId: string }) {
  const sorted = [...runs].sort((a, b) => a.createdAt - b.createdAt);
  const entries = sorted.map((run, index) => {
    const previous = index > 0 ? sorted[index - 1] : null;
    const total = computeTotal(run.evaluation);
    return { run, previous, total, delta: previous ? total - computeTotal(previous.evaluation) : null };
  }).reverse();
  const listMotion = useStagger(true);

  return (
    <motion.aside className="revision-rail" variants={fadeUp}>
      <div className="eyebrow">Revisions</div>
      <motion.div className="revision-list" {...listMotion}>
        {entries.map(({ run, previous, total, delta }) => {
          const current = run.id === currentId;
          const content = (
            <>
              <div className="revision-name">{run.label || run.fileName}</div>
              <div className="revision-meta">{formatDate(run.createdAt)}</div>
              <div className="revision-score"><Delta value={delta} /> · {total}/{MAX_TOTAL}</div>
            </>
          );
          return current ? (
            <motion.div className="revision-item is-current" key={run.id} variants={fadeUp} layout>
              {content}
              {previous && <Link className="revision-diff" href={`/diff?a=${run.id}&b=${previous.id}`}>Compare with previous</Link>}
            </motion.div>
          ) : (
            <motion.div className="revision-item" key={run.id} variants={fadeUp} layout>
              <Link className="revision-link" href={`/results?run=${run.id}`} aria-label={`View ${run.label || run.fileName}`}>{content}</Link>
            </motion.div>
          );
        })}
      </motion.div>
      <Link href="/" className="score-another">Score another resume</Link>
    </motion.aside>
  );
}
