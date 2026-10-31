"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

import { CASES, type DemoSetup } from "./cases";

// The test cases, one card each: set it up, follow the steps, compare with the
// expected results, and tick Passed. The ticks live only in this page's memory,
// so a reload clears them. That is enough for one round of manual testing.
export function CaseList({ onSetUp }: { onSetUp: (setup: DemoSetup) => void }) {
  const [passed, setPassed] = useState<Set<string>>(new Set());

  function togglePassed(id: string) {
    setPassed((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Test cases</h2>
        <div className="flex items-center gap-3">
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {passed.size} of {CASES.length} passed
          </p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setPassed(new Set())}
          >
            Clear ticks
          </Button>
        </div>
      </div>

      {CASES.map((testCase, index) => (
        <article
          key={testCase.id}
          className="space-y-3 rounded-lg border bg-card p-4"
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Case {index + 1} · Journey {testCase.journey}
              </p>
              <h3 className="font-medium">{testCase.title}</h3>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onSetUp(testCase.setup)}
            >
              Set up this case
            </Button>
          </div>

          <div>
            <p className="text-sm font-medium">Steps</p>
            <ol className="mt-1 list-decimal space-y-1 pl-5 text-sm">
              {testCase.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>

          <div>
            <p className="text-sm font-medium">You should see</p>
            <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
              {testCase.expected.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={passed.has(testCase.id)}
              onChange={() => togglePassed(testCase.id)}
            />
            Passed
          </label>
        </article>
      ))}
    </div>
  );
}
