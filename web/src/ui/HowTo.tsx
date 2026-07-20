"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

type DialogAction = { href: string; label: string };

export function HowTo({
  eyebrow,
  title,
  summary,
  icon,
  steps,
  foot,
  action,
  trigger,
}: {
  eyebrow: string;
  title: string;
  summary?: ReactNode;
  icon?: ReactNode;
  steps: ReactNode[];
  foot?: ReactNode;
  action?: DialogAction;
  trigger?: (open: () => void) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    triggerRef.current = document.activeElement as HTMLElement | null;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusable = () =>
      dialogRef.current
        ? Array.from(dialogRef.current.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])'))
        : [];
    requestAnimationFrame(() => focusable()[0]?.focus());

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusable();
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = oldOverflow;
      triggerRef.current?.focus();
    };
  }, [open]);

  return (
    <>
      {trigger ? (
        trigger(() => setOpen(true))
      ) : (
        <button type="button" className="how-button" aria-haspopup="dialog" onClick={() => setOpen(true)}>
          <span className="how-question" aria-hidden="true">?</span>
          How to get a key
        </button>
      )}

      {typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {open && (
            <motion.div
              className="dialog-backdrop"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) setOpen(false);
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduce ? 0 : 0.15 }}
            >
              <motion.div
                ref={dialogRef}
                className="dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                initial={reduce ? false : { opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.99 }}
                transition={{ duration: reduce ? 0 : 0.18 }}
              >
                <button type="button" className="dialog-close" aria-label="Close" onClick={() => setOpen(false)}>
                  ×
                </button>
                {icon && <div className="dialog-icon">{icon}</div>}
                <div className="eyebrow">{eyebrow}</div>
                <h2 id={titleId} className="dialog-title">{title}</h2>
                {summary && <p className="dialog-summary">{summary}</p>}
                <ol className="dialog-steps">
                  {steps.map((step, index) => (
                    <li className="dialog-step" key={index}>
                      <span className="dialog-number">{String(index + 1).padStart(2, "0")}</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
                {action && (
                  <div className="dialog-actions">
                    <a className="button-primary" href={action.href} target="_blank" rel="noreferrer">
                      {action.label}
                    </a>
                  </div>
                )}
                {foot && <p className="dialog-footer">{foot}</p>}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
}
