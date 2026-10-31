"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import type { AutosaveValues } from "@/components/notes/use-autosave";
import type { ActionResult } from "@/lib/shared/result";

import { AutosaveEditor } from "./AutosaveEditor";
import { CaseList } from "./CaseList";
import { DEFAULT_SETUP, type DemoSetup, type FailNext } from "./cases";

// The example page for useAutosave: a live editor wired to the real hook, a fake
// server you can slow down or make fail, and the test cases to walk through.
// Nothing here talks to the real server or the database.

const SAMPLE_NOTE: AutosaveValues = {
  title: "Weekend plans",
  body: "Hike on Saturday",
};

type ServerCopy = AutosaveValues & { version: number };
type LogKind = "start" | "ok" | "fail" | "problem" | "tab";
type LogEntry = { id: number; time: string; kind: LogKind; text: string };

const LATENCY_CHOICES = [
  { ms: 0, label: "Instant" },
  { ms: 300, label: "0.3 s" },
  { ms: 1000, label: "1 s" },
  { ms: 3000, label: "3 s" },
  { ms: 5000, label: "5 s" },
  { ms: 10000, label: "10 s" },
];

const NEXT_SAVE_CHOICES: { value: FailNext; label: string }[] = [
  { value: "none", label: "Succeeds" },
  { value: "returned", label: "Fails (returns an error)" },
  { value: "thrown", label: "Fails (throws)" },
];

const LOG_STYLE: Record<LogKind, string> = {
  start: "",
  ok: "text-emerald-700",
  fail: "text-destructive",
  problem: "bg-destructive text-white font-semibold",
  tab: "italic text-muted-foreground",
};

function clock() {
  const now = new Date();
  const two = (n: number) => String(n).padStart(2, "0");
  const ms = String(now.getMilliseconds()).padStart(3, "0");
  return `${two(now.getHours())}:${two(now.getMinutes())}:${two(now.getSeconds())}.${ms}`;
}

const quote = (text: string) =>
  `"${text.length > 40 ? `${text.slice(0, 40)}...` : text}"`;

const describe = (values: AutosaveValues) =>
  `title ${quote(values.title)}, note ${quote(values.body)}`;

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

export function AutosaveShowcase() {
  const [setup, setSetup] = useState<DemoSetup>(DEFAULT_SETUP);
  const [server, setServer] = useState<ServerCopy>({
    ...SAMPLE_NOTE,
    version: 1,
  });
  const [log, setLog] = useState<LogEntry[]>([]);
  // A new `session` remounts the editor so it opens from the server copy.
  // Closing it unmounts it, which is what journey 5 and 9 are about.
  const [editor, setEditor] = useState({ open: true, session: 0 });

  const logCount = useRef(0);
  const savesStarted = useRef(0);
  const savesRunning = useRef(0);
  const serverVersion = useRef(1);
  // Bumped by every reset, so a save still running from before it is ignored.
  const demoRun = useRef(0);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const addLog = useCallback((kind: LogKind, text: string) => {
    logCount.current += 1;
    const entry = { id: logCount.current, time: clock(), kind, text };
    setLog((current) => [entry, ...current].slice(0, 200));
  }, []);

  // Journey 4 happens in the browser, not in the page, so log it to compare
  // times with the saves.
  useEffect(() => {
    const onVisibilityChange = () =>
      addLog(
        "tab",
        document.visibilityState === "hidden" ? "Tab hidden" : "Tab visible",
      );
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [addLog]);

  useEffect(() => () => clearTimeout(closeTimer.current), []);

  function resetDemo(nextSetup: DemoSetup) {
    clearTimeout(closeTimer.current);
    demoRun.current += 1;
    savesStarted.current = 0;
    serverVersion.current = 1;
    setSetup(nextSetup);
    setServer({ ...SAMPLE_NOTE, version: 1 });
    setLog([]);
    setEditor((current) => ({ open: true, session: current.session + 1 }));
  }

  // The fake server, in the shape the real updateNote action has: a result, not
  // a throw, unless the case asks for a throw.
  async function save(values: AutosaveValues): Promise<ActionResult<unknown>> {
    const run = demoRun.current;
    savesStarted.current += 1;
    const number = savesStarted.current;
    savesRunning.current += 1;
    const overlapping = savesRunning.current > 1;
    addLog(
      overlapping ? "problem" : "start",
      `Save #${number} started${overlapping ? " (OVERLAP: another save is still running)" : ""}: ${describe(values)}`,
    );

    // Decided as the save starts. A failure applies to this one save only.
    const { latencyMs, failNext, rejectEmpty } = setup;
    if (failNext !== "none") {
      setSetup((current) => ({ ...current, failNext: "none" }));
    }

    await sleep(latencyMs);
    savesRunning.current -= 1;
    if (run !== demoRun.current) return { ok: true, data: null };

    if (failNext === "thrown") {
      addLog("fail", `Save #${number} FAILED: the save threw an error`);
      throw new Error("Demo: the save threw");
    }
    if (failNext === "returned") {
      addLog("fail", `Save #${number} FAILED: the server rejected it`);
      return {
        ok: false,
        error: { kind: "not_found", message: "Demo: the server rejected it" },
      };
    }
    if (
      rejectEmpty &&
      values.title.trim() === "" &&
      values.body.trim() === ""
    ) {
      addLog("fail", `Save #${number} FAILED: a note needs a title or a body`);
      return {
        ok: false,
        error: {
          kind: "validation",
          message: "A note needs a title or a body",
        },
      };
    }

    serverVersion.current += 1;
    setServer({ ...values, version: serverVersion.current });
    addLog(
      "ok",
      `Save #${number} accepted. Server copy is now version ${serverVersion.current}`,
    );
    return { ok: true, data: null };
  }

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-8 lg:grid-cols-[26rem_minmax(0,1fr)]">
      <section
        aria-label="Live demo"
        className="space-y-4 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:self-start lg:overflow-y-auto lg:pr-1"
      >
        <div>
          <h1 className="text-2xl font-semibold">useAutosave</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pick a case on the right, click Set up this case, follow its steps
            here, compare with You should see, then tick Passed.
          </p>
        </div>

        {editor.open ? (
          <AutosaveEditor
            key={editor.session}
            initial={server}
            serverCopy={server}
            save={save}
          />
        ) : (
          <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            The editor is closed (unmounted).
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setEditor((c) => ({ ...c, open: false }))}
          >
            Close editor
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              clearTimeout(closeTimer.current);
              closeTimer.current = setTimeout(
                () => setEditor((c) => ({ ...c, open: false })),
                5000,
              );
            }}
          >
            Close editor in 5 s
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setEditor((c) => ({ open: true, session: c.session + 1 }))
            }
          >
            Open editor
          </Button>
        </div>

        <div className="space-y-3 rounded-lg border bg-card p-4">
          <h2 className="text-sm font-semibold">Server copy</h2>
          <dl className="space-y-1 text-sm">
            <div className="flex gap-2">
              <dt className="w-16 text-muted-foreground">Title</dt>
              <dd className="min-w-0 wrap-break-word">
                {server.title || "(empty)"}
              </dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-16 text-muted-foreground">Note</dt>
              <dd className="min-w-0 wrap-break-word">
                {server.body || "(empty)"}
              </dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-16 text-muted-foreground">Version</dt>
              <dd>{server.version}</dd>
            </div>
          </dl>
        </div>

        <div className="space-y-3 rounded-lg border bg-card p-4">
          <h2 className="text-sm font-semibold">Fake server</h2>
          <div className="flex items-center gap-2 text-sm">
            <label htmlFor="demo-latency">Save takes</label>
            <select
              id="demo-latency"
              value={setup.latencyMs}
              onChange={(event) =>
                setSetup((c) => ({
                  ...c,
                  latencyMs: Number(event.target.value),
                }))
              }
              className="h-9 rounded-md border bg-background px-2"
            >
              {LATENCY_CHOICES.map((choice) => (
                <option key={choice.ms} value={choice.ms}>
                  {choice.label}
                </option>
              ))}
            </select>
          </div>
          <fieldset className="space-y-1 text-sm">
            <legend className="mb-1">Next save</legend>
            {NEXT_SAVE_CHOICES.map((choice) => (
              <label key={choice.value} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="demo-next-save"
                  checked={setup.failNext === choice.value}
                  onChange={() =>
                    setSetup((c) => ({ ...c, failNext: choice.value }))
                  }
                />
                {choice.label}
              </label>
            ))}
          </fieldset>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={setup.rejectEmpty}
              onChange={(event) =>
                setSetup((c) => ({ ...c, rejectEmpty: event.target.checked }))
              }
            />
            Reject a note with no title and no body (like the real server)
          </label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => resetDemo(DEFAULT_SETUP)}
          >
            Reset demo
          </Button>
        </div>

        <div className="space-y-2 rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Log (newest first)</h2>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setLog([])}
            >
              Clear log
            </Button>
          </div>
          {log.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nothing yet.</p>
          ) : (
            <ol className="max-h-72 space-y-1 overflow-auto font-mono text-xs">
              {log.map((entry) => (
                <li key={entry.id} className={LOG_STYLE[entry.kind]}>
                  <span className="text-muted-foreground">{entry.time}</span>{" "}
                  {entry.text}
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>

      <section aria-label="Test cases">
        <CaseList onSetUp={resetDemo} />
      </section>
    </div>
  );
}
