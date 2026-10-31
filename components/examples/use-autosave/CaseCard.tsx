"use client";

import { CircleCheck, Circle, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import type {
  AutosaveStatus,
  AutosaveValues,
} from "@/components/notes/use-autosave";
import type { ActionResult } from "@/lib/shared/result";

import { AutosaveEditor } from "./AutosaveEditor";
import {
  advance,
  createFacts,
  SAMPLE_NOTE,
  type Facts,
  type Save,
  type ServerCopy,
  type ShowcaseCase,
} from "./cases";

const LATENCY_CHOICES = [
  { ms: 0, label: "Instant" },
  { ms: 300, label: "0.3 s" },
  { ms: 1000, label: "1 s" },
  { ms: 3000, label: "3 s" },
  { ms: 5000, label: "5 s" },
  { ms: 10000, label: "10 s" },
];

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

type Props = {
  testCase: ShowcaseCase;
  number: number;
  onPassedChange: (id: string, passed: boolean) => void;
};

// One test case: its own editor, its own fake server, and its checklist. Reset
// starts the case again from scratch by remounting everything below.
export function CaseCard(props: Props) {
  const [attempt, setAttempt] = useState(0);
  return (
    <CaseRun
      key={attempt}
      {...props}
      onReset={() => setAttempt((current) => current + 1)}
    />
  );
}

function CaseRun({
  testCase,
  number,
  onPassedChange,
  onReset,
}: Props & { onReset: () => void }) {
  const [latencyMs, setLatencyMs] = useState(testCase.latencyMs);
  const [server, setServer] = useState<ServerCopy>({
    ...SAMPLE_NOTE,
    version: 1,
  });
  // A new `session` remounts the editor so it opens from the server copy.
  // Closing it unmounts it, which is what the unmount cases are about.
  const [editor, setEditor] = useState({ open: true, session: 0 });
  const [progress, setProgress] = useState<{ done: number; problem?: string }>({
    done: 0,
  });

  // What this card has seen so far. The steps read it, and it changes far more
  // often than the screen needs to, so it lives in a ref, not in state.
  const facts = useRef<Facts>(createFacts());
  const doneCount = useRef(0);
  const finished = useRef(false);
  const latency = useRef(latencyMs);
  const failNext = useRef(testCase.failNext);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const evaluate = useCallback(() => {
    if (finished.current) return;
    facts.current.now = Date.now();
    const next = advance(testCase, facts.current, doneCount.current);
    if (next.problem || next.done === testCase.steps.length) {
      finished.current = true;
    }
    if (next.problem || next.done !== doneCount.current) {
      doneCount.current = next.done;
      setProgress(next);
    }
  }, [testCase]);

  // A status change is the hook's doing, not yours or the server's, so it does
  // not restart the "nothing happened for a moment" clock (quiet).
  const record = useCallback(
    (update: (facts: Facts) => void, quiet = false) => {
      update(facts.current);
      if (!quiet) facts.current.lastEventAt = Date.now();
      evaluate();
    },
    [evaluate],
  );

  // Steps like "wait 3 seconds" are about time passing, so look again now and then.
  useEffect(() => {
    const timer = setInterval(evaluate, 200);
    return () => clearInterval(timer);
  }, [evaluate]);

  useEffect(() => {
    const onVisibilityChange = () =>
      record((f) =>
        (document.visibilityState === "hidden" ? f.hidden : f.shown).push(
          Date.now(),
        ),
      );
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [record]);

  useEffect(() => () => clearTimeout(closeTimer.current), []);

  const passed = progress.done === testCase.steps.length;
  useEffect(() => {
    if (!passed) return;
    onPassedChange(testCase.id, true);
    return () => onPassedChange(testCase.id, false);
  }, [passed, testCase.id, onPassedChange]);

  // The fake server, in the shape the real updateNote action has: a result, not
  // a throw, unless the case asks for a throw.
  const save = useCallback(
    async (values: AutosaveValues): Promise<ActionResult<unknown>> => {
      const entry: Save = {
        values,
        serverBefore: {
          title: facts.current.server.title,
          body: facts.current.server.body,
        },
        startedAt: Date.now(),
        overlapped: facts.current.saves.some(
          (save) => save.finishedAt === undefined,
        ),
      };
      record((f) => f.saves.push(entry));

      // Decided as the save starts. A failure applies to this one save only.
      const failure = failNext.current;
      failNext.current = "none";

      await sleep(latency.current);

      if (failure === "thrown") {
        record(() => {
          entry.finishedAt = Date.now();
          entry.outcome = "threw";
        });
        throw new Error("Demo: the save threw");
      }
      if (failure === "returned") {
        record(() => {
          entry.finishedAt = Date.now();
          entry.outcome = "rejected";
        });
        return {
          ok: false,
          error: {
            kind: "not_found",
            message: "Demo: the server rejected it",
          },
        };
      }
      if (values.title.trim() === "" && values.body.trim() === "") {
        record(() => {
          entry.finishedAt = Date.now();
          entry.outcome = "rejected";
        });
        return {
          ok: false,
          error: {
            kind: "validation",
            message: "A note needs a title or a body",
          },
        };
      }

      const accepted = { ...values, version: facts.current.server.version + 1 };
      record((f) => {
        f.server = accepted;
        entry.finishedAt = Date.now();
        entry.outcome = "accepted";
      });
      setServer(accepted);
      return { ok: true, data: null };
    },
    [record],
  );

  const handleEdit = useCallback(
    (values: AutosaveValues) =>
      record((f) => {
        f.title = values.title;
        f.body = values.body;
        f.edits.push(Date.now());
      }),
    [record],
  );
  const handleStatus = useCallback(
    (status: AutosaveStatus) =>
      record((f) => {
        f.status = status;
        f.statusLog.push({ status, at: Date.now() });
      }, true),
    [record],
  );
  const handleFlush = useCallback(
    () => record((f) => f.flushes.push(Date.now())),
    [record],
  );
  const handleLeave = useCallback(
    () => record((f) => f.leaves.push(Date.now())),
    [record],
  );

  function closeEditor() {
    clearTimeout(closeTimer.current);
    record((f) => {
      f.editorOpen = false;
      f.status = undefined;
      f.closed.push(Date.now());
    });
    setEditor((current) => ({ ...current, open: false }));
  }

  function closeEditorIn5Seconds() {
    record((f) => f.closeScheduled.push(Date.now()));
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(closeEditor, 5000);
  }

  function openEditor() {
    record((f) => {
      f.editorOpen = true;
      f.opens += 1;
      f.title = f.server.title;
      f.body = f.server.body;
    });
    setEditor((current) => ({ open: true, session: current.session + 1 }));
  }

  const latencyId = useId();
  const canClose =
    testCase.controls.includes("close") ||
    testCase.controls.includes("closeIn5s");

  return (
    <article
      className={`flex flex-col gap-4 rounded-xl border p-4 ${
        passed
          ? "border-emerald-600/60 bg-emerald-50 dark:border-emerald-400/50 dark:bg-emerald-950/30"
          : "bg-card"
      }`}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
            Case {number}
          </p>
          <h2 className="font-semibold">{testCase.title}</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {testCase.summary}
          </p>
        </div>
        {passed && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white dark:bg-emerald-500 dark:text-emerald-950">
            <CircleCheck className="size-3.5" aria-hidden />
            Passed
          </span>
        )}
      </header>

      {editor.open ? (
        <AutosaveEditor
          key={editor.session}
          initial={server}
          save={save}
          showFlush={testCase.controls.includes("flush")}
          onEdit={handleEdit}
          onStatus={handleStatus}
          onFlush={handleFlush}
          onLeave={handleLeave}
        />
      ) : (
        <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
          The editor is closed.
        </p>
      )}

      {canClose && (
        <div className="flex flex-wrap gap-2">
          {testCase.controls.includes("close") && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!editor.open}
              onClick={closeEditor}
            >
              Close editor
            </Button>
          )}
          {testCase.controls.includes("closeIn5s") && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!editor.open}
              onClick={closeEditorIn5Seconds}
            >
              Close in 5 s
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={editor.open}
            onClick={openEditor}
          >
            Open editor
          </Button>
        </div>
      )}

      <dl className="space-y-0.5 rounded-lg bg-muted/60 px-3 py-2 text-sm">
        <div className="flex gap-2">
          <dt className="w-24 shrink-0 text-muted-foreground">Server copy</dt>
          <dd className="min-w-0 wrap-break-word">
            <span className="text-muted-foreground">v{server.version}</span>
            {" · "}
            {server.title || "(empty)"} / {server.body || "(empty)"}
          </dd>
        </div>
      </dl>

      <ol className="space-y-2">
        {testCase.steps.map((step, index) => {
          const isDone = index < progress.done;
          const isCurrent = index === progress.done && !progress.problem;
          return (
            <li
              key={step.text}
              data-state={isDone ? "done" : isCurrent ? "current" : "todo"}
              className={`flex gap-2 text-sm ${
                isCurrent
                  ? "font-medium"
                  : isDone
                    ? ""
                    : "text-muted-foreground"
              }`}
            >
              {isDone ? (
                <CircleCheck
                  className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400"
                  aria-label="Done"
                />
              ) : (
                <Circle
                  className={`mt-0.5 size-4 shrink-0 ${isCurrent ? "text-foreground" : "text-muted-foreground/60"}`}
                  aria-label={isCurrent ? "Do this now" : "Not yet"}
                />
              )}
              <span>{step.text}</span>
            </li>
          );
        })}
      </ol>

      {progress.problem && (
        <p
          role="alert"
          className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          The hook broke a rule: {progress.problem}
        </p>
      )}

      <footer className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t pt-3">
        <div className="flex items-center gap-2 text-sm">
          <label htmlFor={latencyId}>Save takes</label>
          <select
            id={latencyId}
            value={latencyMs}
            onChange={(event) => {
              const next = Number(event.target.value);
              latency.current = next;
              setLatencyMs(next);
            }}
            className="h-8 rounded-md border bg-background px-2"
          >
            {LATENCY_CHOICES.map((choice) => (
              <option key={choice.ms} value={choice.ms}>
                {choice.label}
              </option>
            ))}
          </select>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={onReset}>
          <RotateCcw aria-hidden />
          Start over
        </Button>
      </footer>
    </article>
  );
}
