import { useCallback, useEffect, useRef, useState } from "react";

import type { ActionResult } from "@/lib/shared/result";

export type AutosaveStatus = "idle" | "saving" | "saved" | "error";

export type AutosaveValues = { title: string; body: string };

type Options = {
  values: AutosaveValues;
  save: (values: AutosaveValues) => Promise<ActionResult<unknown>>;
};

const DEBOUNCE_MS = 1000;
// How long "saved" shows before the status fades back to idle.
const SAVED_MS = 2000;

const sameValues = (a: AutosaveValues, b: AutosaveValues) =>
  a.title === b.title && a.body === b.body;

// True when the save was accepted. One that throws failed just like one that
// returns { ok: false }, including when it throws before it returns a promise:
// that must not leave the in-flight flag set or escape into a timer.
async function attemptSave(save: Options["save"], values: AutosaveValues) {
  try {
    return (await save(values)).ok;
  } catch {
    return false;
  }
}

export function useAutosave(options: Options): {
  status: AutosaveStatus;
  flush: () => void;
} {
  const { values } = options;
  // The timer fires later than the render that scheduled it, so it reads the
  // newest options from here, not the ones it closed over.
  const latest = useRef(options);
  useEffect(() => {
    latest.current = options;
  });

  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  // What the server last accepted, or the values the note opened with. Every
  // save bumps the Note's version server-side, so a save that changes nothing
  // is skipped here rather than sent.
  const lastSaved = useRef(options.values);

  // Only one save runs at a time. A flush that arrives meanwhile is remembered,
  // not sent, and the newest values go out once the running save is done. The
  // queue is one flag because only the latest values ever matter. There is no
  // timeout on purpose: giving up on a slow save would allow a second one while
  // the first may still land, and the version check would reject one of them. A
  // request that stalls fails when the browser gives up, and the queue drains.
  const inFlight = useRef(false);
  const queued = useRef(false);

  const [status, setStatus] = useState<AutosaveStatus>("idle");
  const savedTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  // A save can finish after the component is gone. It still counts as saved,
  // but nothing is left to show a status on, so no timer may start.
  const mounted = useRef(false);

  // Saves now and drops the pending timer, so the same edit is not sent twice.
  const flush = useCallback(function flush() {
    clearTimeout(timer.current);
    if (inFlight.current) {
      queued.current = true;
      return;
    }
    const { values, save } = latest.current;
    if (sameValues(values, lastSaved.current)) {
      // Nothing is unsaved, so an earlier failure no longer applies.
      if (mounted.current) setStatus((s) => (s === "error" ? "idle" : s));
      return;
    }

    inFlight.current = true;
    clearTimeout(savedTimer.current);
    if (mounted.current) setStatus("saving");
    // A failed save leaves the values unsaved, and nothing retries on its own:
    // the next edit or flush sends them again.
    attemptSave(save, values)
      .then((saved) => {
        if (saved) lastSaved.current = values;
        if (!mounted.current) return;
        if (!saved) {
          setStatus("error");
          return;
        }
        setStatus("saved");
        savedTimer.current = setTimeout(() => setStatus("idle"), SAVED_MS);
      })
      .finally(() => {
        inFlight.current = false;
        if (queued.current) {
          queued.current = false;
          flush();
        }
      });
  }, []);

  useEffect(() => {
    timer.current = setTimeout(flush, DEBOUNCE_MS);
    return () => clearTimeout(timer.current);
  }, [values.title, values.body, flush]);

  // Unmounting counts as a flush, so an edit is never dropped silently. The
  // dialog flushes on close too, and then there is nothing left to send.
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      flush();
      clearTimeout(savedTimer.current);
    };
  }, [flush]);

  // Best effort: the save starts when the tab is hidden, but the browser may
  // still suspend or close the page before it finishes.
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") flush();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [flush]);

  return { status, flush };
}
