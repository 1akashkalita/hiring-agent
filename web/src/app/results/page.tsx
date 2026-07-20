"use client";
import { Suspense } from "react";
import { ResultsScreen } from "@/ui/screens/ResultsScreen";

export default function Page() {
  return (
    <Suspense fallback={<p className="eyebrow">Loading…</p>}>
      <ResultsScreen />
    </Suspense>
  );
}
