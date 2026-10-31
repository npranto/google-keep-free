"use client";

import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";

import { CaseCard } from "./CaseCard";
import { CASES } from "./cases";

// The example page for useAutosave: a checklist of cases, each with its own live
// editor wired to the real hook and a fake server. Steps tick by themselves as
// you do them, and a case passes when its last step is ticked. The progress lives
// only in this page's memory, so a reload starts over. Nothing here talks to the
// real server or the database.
export function AutosaveShowcase() {
  // A new `generation` remounts every card, which starts every case again.
  const [generation, setGeneration] = useState(0);
  const [passed, setPassed] = useState<ReadonlySet<string>>(new Set());

  const handlePassedChange = useCallback((id: string, isPassed: boolean) => {
    setPassed((current) => {
      if (current.has(id) === isPassed) return current;
      const next = new Set(current);
      if (isPassed) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const allPassed = passed.size === CASES.length;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-10">
      <div className="py-6">
        <h1 className="text-2xl font-semibold">useAutosave</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Work through each case. Steps tick by themselves as you do them, and a
          case passes when every step is ticked. If a case gets stuck, press
          Start over on its card.
        </p>
      </div>

      <div className="sticky top-0 z-10 -mx-4 flex items-center gap-3 border-b bg-background px-4 py-3">
        <p
          aria-live="polite"
          className={`shrink-0 text-sm font-medium ${allPassed ? "text-emerald-600 dark:text-emerald-400" : ""}`}
        >
          {allPassed
            ? "All cases passed"
            : `${passed.size} of ${CASES.length} passed`}
        </p>
        <div
          role="progressbar"
          aria-label="Cases passed"
          aria-valuemin={0}
          aria-valuemax={CASES.length}
          aria-valuenow={passed.size}
          className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"
        >
          <div
            className="h-full bg-emerald-600 transition-[width] dark:bg-emerald-400"
            style={{ width: `${(passed.size / CASES.length) * 100}%` }}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setGeneration((current) => current + 1)}
        >
          Start all over
        </Button>
      </div>

      <div className="mt-6 grid items-start gap-4 md:grid-cols-2">
        {CASES.map((testCase, index) => (
          <CaseCard
            key={`${testCase.id}:${generation}`}
            testCase={testCase}
            number={index + 1}
            onPassedChange={handlePassedChange}
          />
        ))}
      </div>
    </div>
  );
}
