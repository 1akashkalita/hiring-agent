"use client";
import { Suspense } from "react";
import { DiffScreen } from "@/ui/screens/DiffScreen";

export default function Page() {
  return (
    <Suspense fallback={<p className="eyebrow">Loading…</p>}>
      <DiffScreen />
    </Suspense>
  );
}
