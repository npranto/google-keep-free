import { useCallback, useEffect, useRef, useState } from "react";

import type { ActionResult } from "@/lib/shared/result";

/*
 * useAutosave saves a note's title and body while the person types, with no
 * Save button. The caller hands in the current text and a `save` function. This
 * hook never talks to the server itself.
 *
 * What the person can do, and what this hook does about it:
 *
 *  1. Types, then pauses
 *     One second after the last keystroke, the text is saved.
 *  2. Types in bursts
 *     Every keystroke restarts the one-second wait, so a burst is one save.
 *  3. Clicks away from the editor, or closes it
 *     The caller runs flush(): the text is saved at once, and the pending wait
 *     is cancelled so the same edit is not sent twice.
 *  4. Switches tabs, or minimizes the window
 *     Saving starts straight away. This is best effort: the browser may still
 *     freeze or close the page before the save finishes.
 *  5. Leaves the page while the editor is open
 *     Unmounting saves any unsaved text, so an edit is never dropped silently.
 *  6. Keeps typing while a save is on its way
 *     No second save starts. When the first finishes, ONE more save sends the
 *     newest text.
 *  7. Opens a note and closes it untouched, or types a change and undoes it
 *     Nothing is saved, because the text matches what the server already has.
 *     (Every save bumps the note's version, so a pointless save is not free.)
 *  8. A save fails (network down, rejected, or the note changed elsewhere)
 *     The status becomes "error" and the text stays unsaved. Nothing retries by
 *     itself: the next edit or flush sends it again. Undoing back to the saved
 *     text clears the error, because nothing is unsaved any more.
 *  9. Closes the editor while a save is still on its way
 *     The save still finishes and counts, but there is no screen left to show
 *     "Saved" on, so the status is not touched and no timer starts.
 */

// What the editor shows beside the note: nothing, "Saving...", "Saved" for a
// moment, or an error message.
export type AutosaveStatus = "idle" | "saving" | "saved" | "error";

export type AutosaveValues = { title: string; body: string };

type AutosaveOptions = {
  values: AutosaveValues; // the text as it is right now
  save: (values: AutosaveValues) => Promise<ActionResult<unknown>>;
};

// Journeys 1 and 2: how long the typing must pause before the text is saved.
const WAIT_AFTER_LAST_EDIT_MS = 1000;
// Journey 1: how long "Saved" shows before the status fades back to idle.
const SAVED_MESSAGE_SHOWN_MS = 2000;

const areSameValues = (a: AutosaveValues, b: AutosaveValues) =>
  a.title === b.title && a.body === b.body;

// True when the save was accepted. A save that throws failed just like one that
// returns { ok: false } (journey 8), including when it throws before it returns
// a promise. That must not leave saveIsRunning stuck on or escape into a timer.
async function attemptSave(
  save: AutosaveOptions["save"],
  values: AutosaveValues,
) {
  try {
    return (await save(values)).ok;
  } catch {
    return false;
  }
}

export function useAutosave(options: AutosaveOptions): {
  status: AutosaveStatus;
  flush: () => void;
} {
  const { values } = options;

  // The newest options, for code that runs later than the render that started
  // it: a timer, or a save that finishes after more typing. That code reads them
  // from here, because the options it closed over may be out of date.
  const newestOptions = useRef(options);
  useEffect(() => {
    newestOptions.current = options;
  });

  // Journeys 1 and 2: the timer that waits for the typing to pause.
  const typingPauseTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Journeys 7 and 8: what the server last accepted, or the text the note
  // opened with. A save is skipped when the text equals this.
  const lastSavedValues = useRef(options.values);

  // Journey 6: only one save runs at a time. A flush that arrives meanwhile is
  // remembered, not sent, and the newest text goes out once the running save is
  // done. One flag is enough because only the newest text ever matters. There is
  // no timeout on purpose: giving up on a slow save would allow a second one
  // while the first may still land, and the version check would reject one of
  // them. A request that stalls fails when the browser gives up, and the wait
  // ends then.
  const saveIsRunning = useRef(false);
  const needsAnotherSave = useRef(false);

  const [status, setStatus] = useState<AutosaveStatus>("idle");
  const savedMessageTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Journey 9: a save can finish after the editor is gone. It still counts as
  // saved, but nothing is left to show a status on, so no timer may start.
  const isMounted = useRef(false);

  // Journeys 3 to 8: saves the newest text now, unless there is nothing new to
  // save or a save is already running. The typing timer, the tab, unmounting and
  // the caller's flush() all come through here.
  const saveNow = useCallback(function saveNow() {
    // Journey 3: the wait is no longer needed, so the same edit is not sent twice.
    clearTimeout(typingPauseTimer.current);

    // Journey 6: a save is running, so ask for one more afterward and stop.
    if (saveIsRunning.current) {
      needsAnotherSave.current = true;
      return;
    }

    // Journey 7: nothing new to save.
    const { values: valuesToSave, save } = newestOptions.current;
    if (areSameValues(valuesToSave, lastSavedValues.current)) {
      // Journey 8: undoing back to the saved text means nothing is unsaved, so
      // an earlier error no longer applies.
      if (isMounted.current) setStatus((s) => (s === "error" ? "idle" : s));
      return;
    }

    saveIsRunning.current = true;
    clearTimeout(savedMessageTimer.current);
    if (isMounted.current) setStatus("saving");

    // Journey 8: a failed save leaves the text unsaved, and nothing retries on
    // its own. The next edit or flush sends it again.
    attemptSave(save, valuesToSave)
      .then((succeeded) => {
        if (succeeded) lastSavedValues.current = valuesToSave;

        // Journey 9: the editor is gone, so there is nothing to update.
        if (!isMounted.current) return;

        if (!succeeded) {
          setStatus("error");
          return;
        }
        setStatus("saved");
        savedMessageTimer.current = setTimeout(
          () => setStatus("idle"),
          SAVED_MESSAGE_SHOWN_MS,
        );
      })
      .finally(() => {
        saveIsRunning.current = false;

        // Journey 6: the one extra save, with whatever the newest text is now.
        if (needsAnotherSave.current) {
          needsAnotherSave.current = false;
          saveNow();
        }
      });
  }, []);

  // Journeys 1 and 2: every change to the text restarts the wait.
  useEffect(() => {
    typingPauseTimer.current = setTimeout(saveNow, WAIT_AFTER_LAST_EDIT_MS);
    return () => clearTimeout(typingPauseTimer.current);
  }, [values.title, values.body, saveNow]);

  // Journey 5: leaving the page counts as a flush, so an edit is never dropped
  // silently. The dialog flushes on close too (journey 3), and then there is
  // nothing left to send. This effect also tracks whether the editor is still
  // on screen, for journey 9.
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      saveNow();
      clearTimeout(savedMessageTimer.current);
    };
  }, [saveNow]);

  // Journey 4: best effort. The save starts when the tab is hidden, but the
  // browser may still suspend or close the page before it finishes.
  useEffect(() => {
    const saveWhenTabIsHidden = () => {
      if (document.visibilityState === "hidden") saveNow();
    };
    document.addEventListener("visibilitychange", saveWhenTabIsHidden);
    return () =>
      document.removeEventListener("visibilitychange", saveWhenTabIsHidden);
  }, [saveNow]);

  // Callers know saveNow as flush(): the editor runs it when focus leaves or
  // the dialog closes (journey 3). The name stays flush so callers do not change.
  return { status, flush: saveNow };
}
