"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { StoredSettings } from "@/lib/schemas";
import { clearAllData } from "@/lib/settings";
import { DEFAULT_MODEL, GEMINI_MODELS } from "@/lib/gemini";
import { useSettings } from "@/ui/SettingsProvider";
import { HowTo } from "@/ui/HowTo";
import { BackLoopIcon, CheckIcon, ChevronDownIcon, EyeIcon, EyeOffIcon, KeyIcon } from "@/ui/Icons";
import { fadeUp, useStagger } from "@/ui/motion";

export function SettingsScreen() {
  const { settings, update, reset } = useSettings();
  const [saved, setSaved] = useState(false);
  const [cleared, setCleared] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [modelOpen, setModelOpen] = useState(false);
  const reduceMotion = useReducedMotion();
  const pageMotion = useStagger(true);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const modelPicker = useRef<HTMLDivElement | null>(null);
  const modelTrigger = useRef<HTMLButtonElement | null>(null);
  const modelOptions = useRef<Array<HTMLButtonElement | null>>([]);

  const selectedModel = GEMINI_MODELS.find((model) => model.id === settings.model)
    ?? GEMINI_MODELS.find((model) => model.id === DEFAULT_MODEL)
    ?? GEMINI_MODELS[0];
  const selectedIndex = GEMINI_MODELS.findIndex((model) => model.id === selectedModel.id);

  useEffect(() => () => {
    if (savedTimer.current) clearTimeout(savedTimer.current);
  }, []);

  useEffect(() => {
    if (!modelOpen) return;
    const close = (event: PointerEvent) => {
      if (!modelPicker.current?.contains(event.target as Node)) setModelOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [modelOpen]);

  const edit = useCallback((patch: Partial<StoredSettings>) => {
    update(patch);
    setSaved(true);
    setCleared(false);
    if (savedTimer.current) clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setSaved(false), 1600);
  }, [update]);

  const clear = useCallback(async () => {
    if (!window.confirm("Erase all saved runs, resumes, and settings from this browser? This cannot be undone.")) return;
    setClearing(true);
    try {
      await clearAllData();
      reset();
      setCleared(true);
    } finally {
      setClearing(false);
    }
  }, [reset]);

  const focusOption = useCallback((index: number) => modelOptions.current[index]?.focus(), []);
  const chooseModel = useCallback((model: string) => {
    edit({ model });
    setModelOpen(false);
    requestAnimationFrame(() => modelTrigger.current?.focus());
  }, [edit]);

  function onOptionKeyDown(event: React.KeyboardEvent, index: number) {
    if (event.key === "ArrowDown") { event.preventDefault(); focusOption((index + 1) % GEMINI_MODELS.length); }
    if (event.key === "ArrowUp") { event.preventDefault(); focusOption((index - 1 + GEMINI_MODELS.length) % GEMINI_MODELS.length); }
    if (event.key === "Home") { event.preventDefault(); focusOption(0); }
    if (event.key === "End") { event.preventDefault(); focusOption(GEMINI_MODELS.length - 1); }
    if (event.key === "Escape") { event.preventDefault(); setModelOpen(false); modelTrigger.current?.focus(); }
  }

  return (
    <motion.section className="settings-layout" {...pageMotion}>
      <motion.aside className="settings-back" variants={fadeUp}>
        <Link href="/" className="back-link" aria-label="Back to score a resume">
          <BackLoopIcon size={18} /> <span>back</span>
        </Link>
      </motion.aside>

      <motion.div className="settings-main" variants={fadeUp}>
        <header className="settings-heading">
          <div className="page-kicker">Settings</div>
          <h1>Keys, scoring, and privacy.</h1>
          <p>Configure the browser-based scoring pipeline. Changes save automatically on this device.</p>
        </header>

        <section className="settings-section">
          <header className="settings-section-head">
            <h2>Gemini scoring</h2>
            <p>Required to extract, score, and coach each resume.</p>
          </header>
          <div className="settings-section-body">
            <label className="field" htmlFor="gemini-key">
              <span className="field-label-row">
                <span className="field-label">Gemini API key</span>
                <HowTo
                  eyebrow="Gemini API key"
                  title="Get a key in about a minute."
                  summary="Google AI Studio creates the key used for direct browser-to-Gemini requests."
                  icon={<KeyIcon size={20} />}
                  steps={[
                    <><strong>Open Google AI Studio.</strong> Sign in with the Google account you want to use for Gemini API access.</>,
                    <><strong>Create an API key.</strong> Google generates a key that typically begins with <code>AIza</code>.</>,
                    <><strong>Paste it here.</strong> The key is then used only for requests your browser sends directly to Google Gemini.</>,
                  ]}
                  action={{ href: "https://aistudio.google.com/apikey", label: "Open AI Studio" }}
                  foot={settings.rememberKeys
                    ? "Remember keys is on, so this key is stored in this browser's localStorage. It is never sent to a Fix My Resume server."
                    : "Remember keys is off, so this key stays in memory for this tab and clears when the tab closes. It is never sent to a Fix My Resume server."}
                  trigger={(open) => (
                    <button type="button" className="how-button" aria-label="How to get a Gemini API key" aria-haspopup="dialog" onClick={open}>
                      <span className="how-question" aria-hidden="true">?</span> How to get a key
                    </button>
                  )}
                />
              </span>
              <span className="input-wrap">
                <input
                  id="gemini-key"
                  type={showKey ? "text" : "password"}
                  className="text-input"
                  placeholder="AIza..."
                  autoComplete="off"
                  spellCheck={false}
                  value={settings.geminiKey}
                  onChange={(event) => edit({ geminiKey: event.target.value })}
                />
                <button type="button" className="reveal-button" onClick={() => setShowKey((value) => !value)} aria-label={showKey ? "Hide Gemini API key" : "Show Gemini API key"}>
                  {showKey ? <EyeOffIcon size={17} /> : <EyeIcon size={17} />}
                </button>
              </span>
              <span className="field-note">Sent directly from this browser to Google only while extracting, scoring, and coaching.</span>
            </label>

            <div className="field">
              <span className="field-label" id="model-label">Model</span>
              <div
                className="select-wrap"
                ref={modelPicker}
                onBlur={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setModelOpen(false);
                }}
              >
                <button
                  id="ha-model"
                  ref={modelTrigger}
                  type="button"
                  className="select-trigger"
                  aria-haspopup="listbox"
                  aria-expanded={modelOpen}
                  aria-controls="model-options"
                  aria-labelledby="model-label ha-model"
                  onClick={() => setModelOpen((value) => !value)}
                  onKeyDown={(event) => {
                    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                      event.preventDefault();
                      setModelOpen(true);
                      requestAnimationFrame(() => focusOption(selectedIndex));
                    }
                  }}
                >
                  <span>{selectedModel.label}</span>
                  <motion.span
                    className="select-chevron"
                    animate={{ rotate: modelOpen && !reduceMotion ? 180 : 0 }}
                    transition={reduceMotion ? { duration: 0 } : { duration: 0.16 }}
                  >
                    <ChevronDownIcon size={16} />
                  </motion.span>
                </button>
                <AnimatePresence>
                  {modelOpen && (
                    <motion.div
                      id="model-options"
                      className="select-menu"
                      data-motion-menu
                      role="listbox"
                      aria-labelledby="model-label"
                      initial={reduceMotion ? false : { opacity: 0, y: -6, scale: 0.99 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={reduceMotion ? undefined : { opacity: 0, y: -4, scale: 0.99 }}
                      transition={reduceMotion ? { duration: 0 } : { duration: 0.16, ease: [0.22, 0.61, 0.36, 1] }}
                    >
                      {GEMINI_MODELS.map((model, index) => {
                        const selected = model.id === selectedModel.id;
                        return (
                          <button
                            key={model.id}
                            ref={(node) => { modelOptions.current[index] = node; }}
                            type="button"
                            className={`select-option${selected ? " is-selected" : ""}`}
                            role="option"
                            aria-selected={selected}
                            onClick={() => chooseModel(model.id)}
                            onKeyDown={(event) => onOptionKeyDown(event, index)}
                          >
                            <span>{model.label}</span>{selected && <CheckIcon size={15} />}
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <span className="field-note">Gemini 3.1 Flash-Lite is the default. The menu shows official model names; model codes remain internal.</span>
            </div>
          </div>
        </section>

        <section className="settings-section danger-section">
          <div className="settings-section-body">
            <div className="settings-row">
              <span className="settings-row-copy"><strong>Clear all browser data</strong><span>Erase saved runs, resumes, keys, and settings. Your theme preference is kept.</span></span>
              <button type="button" className="danger-button" onClick={clear} disabled={clearing}>{clearing ? "Clearing..." : "Clear all data"}</button>
            </div>
            {cleared && <div className="field-note" role="status">All browser data cleared.</div>}
          </div>
        </section>

        <div className="save-status" aria-live="polite">
          <AnimatePresence>
            {saved && (
              <motion.span
                initial={reduceMotion ? false : { opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? undefined : { opacity: 0, y: -3 }}
                transition={reduceMotion ? { duration: 0 } : { duration: 0.15 }}
              >
                Saved
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.section>
  );
}
