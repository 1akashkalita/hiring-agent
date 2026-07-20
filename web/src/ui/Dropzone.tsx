"use client";

import { useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { UploadIcon } from "@/ui/Icons";

const MAX_MB = 15;

function firstPdf(files: FileList | null) {
  return Array.from(files ?? []).find((file) => file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) ?? null;
}

export function Dropzone({ onFile, onReject, disabled = false }: {
  onFile: (file: File) => void;
  onReject?: (reason: string) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const reduceMotion = useReducedMotion();

  function accept(files: FileList | null) {
    const file = firstPdf(files);
    if (!file) {
      if (files?.length) onReject?.("Please choose a PDF file.");
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      onReject?.(`That PDF is over ${MAX_MB}MB. Try exporting a lighter file.`);
      return;
    }
    onFile(file);
  }

  return (
    <motion.div
      data-motion-dropzone
      className={`dropzone${over ? " is-over" : ""}${disabled ? " is-disabled" : ""}`}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      aria-label="Upload a resume PDF"
      onClick={() => !disabled && inputRef.current?.click()}
      onKeyDown={(event) => {
        if (!disabled && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault();
          inputRef.current?.click();
        }
      }}
      onDragOver={(event) => { event.preventDefault(); if (!disabled) setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(event) => { event.preventDefault(); setOver(false); if (!disabled) accept(event.dataTransfer.files); }}
      animate={{ y: !reduceMotion && over ? -1 : 0 }}
      whileHover={!reduceMotion && !disabled ? { y: -1 } : undefined}
      whileTap={!reduceMotion && !disabled ? { y: 0 } : undefined}
      transition={{ type: "spring", stiffness: 420, damping: 34 }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        hidden
        onChange={(event) => { accept(event.target.files); event.target.value = ""; }}
      />
      <div>
        <div className="dropzone-icon"><UploadIcon size={23} /></div>
        <div className="dropzone-title">Drop your resume PDF</div>
        <div className="dropzone-sub">or click to choose a file</div>
        <div className="dropzone-note">PDF only · up to 15 MB · text extracted in this browser</div>
      </div>
    </motion.div>
  );
}
