"use client";

import { LockIcon } from "@/ui/Icons";
import { HowTo } from "@/ui/HowTo";

export function PrivacyChip() {
  return (
    <HowTo
      eyebrow="Privacy"
      title="Your resume skips our servers."
      summary="The app is a client-side tool. Here is the exact path your data takes."
      icon={<LockIcon size={20} />}
      steps={[
        <><strong>PDF reading happens here.</strong> Your browser extracts the text from your PDF locally; the PDF file itself is not uploaded to us.</>,
        <><strong>Scoring goes directly to Google.</strong> Your browser sends the extracted resume text and your API key directly to Google Gemini. They never pass through a server operated by Fix My Resume.</>,
        <><strong>Your history stays local.</strong> Score reports, settings, and saved revisions use local browser storage until you clear them.</>,
      ]}
      foot="Gemini scoring requires an internet connection. When a resume includes a GitHub profile, enrichment connects directly from your browser to GitHub's API."
      trigger={(open) => (
        <button type="button" className="privacy-button" aria-haspopup="dialog" onClick={open}>
          <LockIcon size={14} />
          <span>100% private</span>
        </button>
      )}
    />
  );
}
