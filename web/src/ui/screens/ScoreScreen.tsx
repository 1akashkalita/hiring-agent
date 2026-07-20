"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRightIcon, CheckIcon, KeyIcon, LockIcon } from "@/ui/Icons";
import { Dropzone } from "@/ui/Dropzone";
import { useSettings } from "@/ui/SettingsProvider";
import { toPipelineSettings } from "@/lib/settings";
import { runScoreWithRealDeps } from "@/lib/runScore";
import { saveRun, saveTransientRun } from "@/lib/store";
import { describeError, type ErrorInfo } from "@/lib/errorMessage";

const STAGES = ["Reading PDF", "Extracting resume", "Enriching from GitHub", "Scoring", "Coaching"];

const STAGE_META: Record<string, { title: string; note: string }> = {
  "Reading PDF": { title: "Extracting text from PDF", note: "The PDF is parsed locally with pdf.js." },
  "Extracting resume": { title: "Finding structured details", note: "Gemini identifies resume sections and a GitHub profile, if present." },
  "Enriching from GitHub": { title: "Reading public GitHub projects", note: "Fetching public repository names, stars, and contributor data." },
  Scoring: { title: "Scoring the 100-point rubric", note: "Four weighted categories with fairness constraints." },
  Coaching: { title: "Prioritizing improvements", note: "Turning the evidence into concrete, point-valued fixes." },
};

const RUBRIC = ["Open source · 35", "Self projects · 30", "Production · 25", "Skills · 10"];

function formatSize(bytes: number) {
  if (!bytes) return "";
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1048576).toFixed(1)} MB`;
}

function ScoreState({ state, reduceMotion, children }: { state: string; reduceMotion: boolean | null; children: ReactNode }) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={state}
        data-motion-score-state={state}
        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
        transition={reduceMotion ? { duration: 0 } : { duration: 0.2, ease: [0.22, 0.61, 0.36, 1] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

export function ScoreScreen() {
  const router = useRouter();
  const { settings, hasKey } = useSettings();
  const reduceMotion = useReducedMotion();
  const stages = STAGES;
  const [stage, setStage] = useState<string | null>(null);
  const [seen, setSeen] = useState<Set<string>>(() => new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ErrorInfo | null>(null);
  const [lastFile, setLastFile] = useState<File | null>(null);
  const [fileMeta, setFileMeta] = useState({ name: "", size: "" });
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  async function handleFile(file: File, persistence: "history" | "transient" = "history") {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLastFile(file);
    setFileMeta({ name: file.name, size: formatSize(file.size) });
    setError(null);
    setSeen(new Set([stages[0]]));
    setBusy(true);
    setStage(stages[0]);

    try {
      const run = await runScoreWithRealDeps(
        file,
        toPipelineSettings(settings),
        (nextStage) => {
          setStage(nextStage);
          setSeen((current) => new Set(current).add(nextStage));
        },
        controller.signal,
      );
      if (controller.signal.aborted) return;
      try {
        if (persistence === "transient") await saveTransientRun(run);
        else await saveRun(run);
      } catch (storageError) {
        console.warn(`Run scored but not saved to ${persistence === "transient" ? "this tab" : "history"}:`, storageError);
      }
      router.push(`/results?run=${run.id}`);
    } catch (caught) {
      if (controller.signal.aborted) return;
      setError(describeError(caught));
      setStage(null);
      setBusy(false);
    }
  }

  async function scoreSample() {
    try {
      const response = await fetch("/sample-resume.pdf");
      if (!response.ok) throw new Error("Sample unavailable");
      const blob = await response.blob();
      await handleFile(new File([blob], "sample-resume.pdf", { type: "application/pdf" }), "transient");
    } catch {
      setError({ message: "Couldn't load the sample resume. Check your connection and try again.", retryLabel: null, tone: "bad" });
    }
  }

  function cancel() {
    abortRef.current?.abort();
    setBusy(false);
    setStage(null);
    setError(null);
  }

  if (!hasKey) {
    return (
      <ScoreState state="key-required" reduceMotion={reduceMotion}>
        <section className="key-gate">
          <div className="key-gate-inner">
            <div className="key-gate-icon"><KeyIcon size={27} /></div>
            <div className="page-kicker">One-time setup</div>
            <h1>Add your Gemini key. Then start scoring.</h1>
            <p>Your browser uses your own Gemini API key and sends scoring requests directly to Google. Fix My Resume does not operate a server that receives your resume or key.</p>
            <div className="key-gate-actions">
              <Link href="/settings" className="button-primary">
                Open settings <ArrowRightIcon size={16} />
              </Link>
            </div>
            <div className="key-gate-meta">
              <span><CheckIcon size={14} /> Stored only in this browser</span>
              <span><LockIcon size={14} /> Direct connection to Google</span>
            </div>
          </div>
        </section>
      </ScoreState>
    );
  }

  const activeIndex = stage ? stages.indexOf(stage) : -1;
  const progress = activeIndex < 0 ? 0 : Math.round(((activeIndex + 0.5) / stages.length) * 100);

  if (busy) {
    return (
      <ScoreState state="scoring" reduceMotion={reduceMotion}>
        <section className="scoring-page" aria-busy="true">
          <p className="sr-only" role="status" aria-live="polite">
            {stage ? `${STAGE_META[stage]?.title ?? stage}, step ${activeIndex + 1} of ${stages.length}` : ""}
          </p>
          <div className="scoring-head">
            <div className="page-kicker">Scoring in progress</div>
            <h1>{fileMeta.name || "Your resume"}</h1>
          </div>
          <ol className="stage-list" aria-hidden="true">
            {stages.map((item, index) => {
              const state = item === stage ? "active" : seen.has(item) ? "done" : index < activeIndex ? "skipped" : "pending";
              return (
                <motion.li
                  layout={!reduceMotion}
                  className={`stage-item is-${state}`}
                  key={item}
                  initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                  animate={{ opacity: state === "skipped" ? 0.62 : 1, y: 0 }}
                  transition={reduceMotion ? { duration: 0 } : { duration: 0.18, delay: index * 0.035 }}
                >
                  <span className="stage-number">{state === "done" ? "✓" : state === "skipped" ? "–" : index + 1}</span>
                  <span className="stage-copy"><strong>{STAGE_META[item].title}</strong><span>{STAGE_META[item].note}</span></span>
                  <span className="stage-status">{state === "active" ? "working" : state}</span>
                </motion.li>
              );
            })}
          </ol>
          <div className="progress-wrap">
            <div className="progress-track"><motion.div className="progress-fill" animate={{ width: `${progress}%` }} transition={reduceMotion ? { duration: 0 } : { duration: 0.28 }} /></div>
            <div className="progress-meta">
              <span>{fileMeta.name}{fileMeta.size ? ` · ${fileMeta.size}` : ""}</span>
              <span>{progress}% · direct browser-to-Google scoring</span>
            </div>
          </div>
          <div className="cancel-row"><button type="button" className="button-secondary" onClick={cancel}>Cancel</button></div>
        </section>
      </ScoreState>
    );
  }

  return (
    <ScoreState state="upload" reduceMotion={reduceMotion}>
      <section className="score-page">
        <div className="score-intro">
          <div className="page-kicker">Score a resume</div>
          <h1>Drop a resume. Get an honest read.</h1>
          <p>An explainable score out of 100 across four weighted categories, followed by the most valuable fixes to make next.</p>
        </div>
        <Dropzone
          onFile={handleFile}
          onReject={(message) => setError({ message, retryLabel: null, tone: "bad" })}
        />
        <AnimatePresence>
          {error && (
            <motion.div
              className={`error-banner${error.tone === "warn" ? " is-warning" : ""}`}
              role="alert"
              initial={reduceMotion ? false : { opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
              transition={reduceMotion ? { duration: 0 } : { duration: 0.16 }}
            >
              <span>{error.message}</span>
              {error.retryLabel && lastFile && <button type="button" onClick={() => handleFile(lastFile)}>{error.retryLabel}</button>}
            </motion.div>
          )}
        </AnimatePresence>
        <div className="rubric-row">
          {RUBRIC.map((item) => <span className="rubric-pill" key={item}>{item}</span>)}
          <button type="button" className="sample-button" onClick={scoreSample}>Score a sample resume</button>
        </div>
      </section>
    </ScoreState>
  );
}
