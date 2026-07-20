"use client";

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { RunRecord } from "@/lib/schemas";
import { computeTotal } from "@/lib/scoring";
import { diffRuns } from "@/lib/diff";
import { dateTime } from "@/lib/format";
import { Delta } from "@/ui/Delta";
import { fadeUp, useStagger } from "@/ui/motion";

export function HistoryTable({ runs, onRename, onDelete }: {
  runs: RunRecord[];
  onRename: (id: string, label: string) => void;
  onDelete: (id: string) => void;
}) {
  const rows = runs.map((run, index) => ({ run, previous: index > 0 ? runs[index - 1] : null })).reverse();
  const rowsMotion = useStagger();
  const reduceMotion = useReducedMotion();

  function rename(run: RunRecord) {
    const result = window.prompt("Label for this revision", run.label ?? "");
    if (result?.trim()) onRename(run.id, result.trim());
  }

  function remove(run: RunRecord) {
    if (window.confirm(`Delete "${run.label || run.fileName}"? This cannot be undone.`)) onDelete(run.id);
  }

  return (
    <div className="history-table-wrap">
      <table className="history-table">
        <thead><tr><th>Revision</th><th className="hide-mobile">Date</th><th className="align-right">Score</th><th className="align-right">Change</th><th /></tr></thead>
        <motion.tbody {...rowsMotion}>
          <AnimatePresence initial={false}>
            {rows.map(({ run, previous }) => (
              <motion.tr key={run.id} variants={fadeUp} layout={!reduceMotion} exit={reduceMotion ? undefined : { opacity: 0, x: -6 }}>
              <td>
                <span className="history-name">{run.fileName}</span>
                {run.label && <span className="history-label">{run.label}</span>}
                <button type="button" className="history-rename" onClick={() => rename(run)}>rename</button>
              </td>
              <td className="history-date hide-mobile">{dateTime(run.createdAt)}</td>
              <td className="align-right history-total">{computeTotal(run.evaluation)}</td>
              <td className="align-right"><Delta value={diffRuns(run, previous).total} /></td>
              <td className="align-right">
                <Link className="table-action" href={`/results?run=${run.id}`}>View</Link>
                {previous && <Link className="table-action" href={`/diff?a=${run.id}&b=${previous.id}`}>Diff</Link>}
                <button type="button" className="table-action is-danger" onClick={() => remove(run)}>Delete</button>
              </td>
              </motion.tr>
            ))}
          </AnimatePresence>
        </motion.tbody>
      </table>
    </div>
  );
}
