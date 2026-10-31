import type {
  AutosaveStatus,
  AutosaveValues,
} from "@/components/notes/use-autosave";

// The test cases for the useAutosave example page. Each case has its own editor
// and a checklist of steps. A step is ticked by the page itself when it sees you
// do it (or sees the hook react), so there is nothing to tick by hand. A case is
// passed when its last step is ticked.
//
// Everything the page has seen so far is kept in Facts. A step is a plain
// function of Facts, so adding or changing a case never touches the page code.
// The cases follow the journeys listed at the top of components/notes/use-autosave.ts.

export const SAMPLE_NOTE: AutosaveValues = {
  title: "Weekend plans",
  body: "Hike on Saturday",
};

export type ServerCopy = AutosaveValues & { version: number };

export type SaveOutcome = "accepted" | "rejected" | "threw";

export type Save = {
  values: AutosaveValues; // the text this save sent
  serverBefore: AutosaveValues; // what the server held when the save started
  startedAt: number;
  finishedAt?: number;
  outcome?: SaveOutcome;
  overlapped: boolean; // another save was still running when this one started
};

export type Facts = {
  now: number;
  lastEventAt: number; // the last thing you did or the server did (not a status change)
  title: string; // the editor's text right now
  body: string;
  server: ServerCopy;
  editorOpen: boolean;
  opens: number; // how many times the editor has been opened, the first time included
  status?: AutosaveStatus; // undefined while the editor is closed
  statusLog: { status: AutosaveStatus; at: number }[];
  edits: number[]; // when the text changed
  flushes: number[]; // when Flush was clicked
  leaves: number[]; // when focus left the editor
  hidden: number[]; // when the browser tab was hidden
  shown: number[]; // when it was shown again
  closeScheduled: number[]; // when "Close in 5 s" was clicked
  closed: number[]; // when the editor was closed
  saves: Save[];
};

export function createFacts(): Facts {
  return {
    now: 0,
    lastEventAt: 0,
    ...SAMPLE_NOTE,
    server: { ...SAMPLE_NOTE, version: 1 },
    editorOpen: true,
    opens: 1,
    statusLog: [],
    edits: [],
    flushes: [],
    leaves: [],
    hidden: [],
    shown: [],
    closeScheduled: [],
    closed: [],
    saves: [],
  };
}

export type FailNext = "none" | "returned" | "thrown";

export type CaseStep = { text: string; done: (facts: Facts) => boolean };

export type ShowcaseCase = {
  id: string;
  title: string;
  summary: string;
  latencyMs: number; // how long a save takes; the card lets you change it
  failNext: FailNext; // makes only the first save fail
  controls: ("flush" | "close" | "closeIn5s")[]; // extra buttons beside the editor
  steps: CaseStep[];
};

const same = (a: AutosaveValues, b: AutosaveValues) =>
  a.title === b.title && a.body === b.body;

// Two things the hook promises in every case. Seeing either one is a bug, so the
// card stops and says so instead of passing.
export function findProblem(facts: Facts): string | undefined {
  const overlap = facts.saves.findIndex((save) => save.overlapped);
  if (overlap >= 0) {
    return `Save #${overlap + 1} started while another save was still running.`;
  }
  const pointless = facts.saves.findIndex((save) =>
    same(save.values, save.serverBefore),
  );
  if (pointless >= 0) {
    return `Save #${pointless + 1} sent text the server already had.`;
  }
  return undefined;
}

// Ticks every step that is now done, in order, and never un-ticks one.
export function advance(
  testCase: ShowcaseCase,
  facts: Facts,
  done: number,
): { done: number; problem?: string } {
  const problem = findProblem(facts);
  if (problem) return { done, problem };
  while (done < testCase.steps.length && testCase.steps[done].done(facts)) {
    done += 1;
  }
  return { done };
}

const last = (times: number[]) => times[times.length - 1];

const typed = (f: Facts) => f.edits.length > 0;
const idleFor = (f: Facts, ms: number) => f.now - f.lastEventAt >= ms;
const saveIsRunning = (f: Facts) =>
  f.saves.some((save) => save.finishedAt === undefined);
const textIsSaved = (f: Facts) => same(f, f.server);
const textIsSample = (f: Facts) => same(f, SAMPLE_NOTE);
const isBlank = (f: Facts) => f.title.trim() === "" && f.body.trim() === "";

// Nothing is running, nothing happened for a moment, and the server holds what
// the editor shows: the hook has had every chance to send anything it wanted to.
const settled = (f: Facts) =>
  f.saves.length > 0 && !saveIsRunning(f) && idleFor(f, 1500) && textIsSaved(f);

const sawStatus = (f: Facts, status: AutosaveStatus) =>
  f.statusLog.some((entry) => entry.status === status);

const sawStatusesInOrder = (f: Facts, order: AutosaveStatus[]) => {
  let next = 0;
  for (const entry of f.statusLog) {
    if (entry.status === order[next]) next += 1;
  }
  return next === order.length;
};

// When the status last turned to "Could not save".
const errorAt = (f: Facts) =>
  f.statusLog.findLast((entry) => entry.status === "error")?.at;

const acceptedAfter = (f: Facts, at: number | undefined) =>
  at !== undefined &&
  f.saves.some(
    (save) => save.outcome === "accepted" && (save.finishedAt ?? 0) > at,
  );

// A save began within half a second after one of these moments. The small
// allowance before is because the hook's own listener can run a moment first.
const startedRightAfter = (f: Facts, moments: number[]) =>
  f.saves.some((save) =>
    moments.some(
      (at) => save.startedAt >= at - 50 && save.startedAt - at < 500,
    ),
  );

// How long you had stopped typing when the first save began.
const pauseBeforeFirstSave = (f: Facts) => {
  const first = f.saves[0];
  if (!first) return undefined;
  const lastEdit = f.edits.findLast((at) => at <= first.startedAt);
  return lastEdit === undefined ? undefined : first.startedAt - lastEdit;
};

// Short pauses (under a second) in your typing before the first save began.
const shortPauses = (f: Facts) => {
  const until = f.saves[0]?.startedAt ?? Infinity;
  let count = 0;
  for (let i = 1; i < f.edits.length; i += 1) {
    const gap = f.edits[i] - f.edits[i - 1];
    if (f.edits[i] < until && gap >= 400 && gap < 1000) count += 1;
  }
  return count;
};

const closedWhileSaving = (f: Facts) =>
  f.closed.some((at) =>
    f.saves.some(
      (save) =>
        save.startedAt <= at &&
        (save.finishedAt === undefined || at < save.finishedAt),
    ),
  );

// "Rejected" and "throws" differ only in how the fake server fails.
function failThenRetry(
  id: string,
  title: string,
  summary: string,
  failNext: "returned" | "thrown",
): ShowcaseCase {
  const failure =
    failNext === "returned"
      ? "The server rejects the save"
      : "The save crashes";
  return {
    id,
    title,
    summary,
    latencyMs: 300,
    failNext,
    controls: [],
    steps: [
      { text: "Type a few words at the end of Note.", done: typed },
      {
        text: `Wait. ${failure}, and the status says Could not save.`,
        done: (f) => sawStatus(f, "error"),
      },
      {
        text: "Type one more character. The editor still works.",
        done: (f) => f.edits.some((at) => at > (errorAt(f) ?? Infinity)),
      },
      {
        text: "The text is sent again and saved. Server copy holds all of it.",
        done: (f) => acceptedAfter(f, errorAt(f)) && textIsSaved(f),
      },
    ],
  };
}

export const CASES: ShowcaseCase[] = [
  {
    id: "pause-saves-once",
    title: "A pause after typing saves",
    summary: "Type, then stop. The save starts on its own.",
    latencyMs: 300,
    failNext: "none",
    controls: [],
    steps: [
      { text: "Type a few words at the end of Note.", done: typed },
      {
        text: "Stop typing. A save starts about 1 second later.",
        done: (f) => {
          const pause = pauseBeforeFirstSave(f);
          return pause !== undefined && pause >= 900 && pause <= 2000;
        },
      },
      {
        text: "The status goes Saving..., then Saved, then back to Idle.",
        done: (f) =>
          sawStatusesInOrder(f, ["saving", "saved", "idle"]) && textIsSaved(f),
      },
    ],
  },
  {
    id: "bursts-save-once",
    title: "Typing in bursts is one save",
    summary: "Short pauses keep postponing the save.",
    latencyMs: 300,
    failNext: "none",
    controls: [],
    steps: [
      {
        text: "Type a few letters, pause for less than a second, type more. Do it 3 times.",
        done: (f) => shortPauses(f) >= 3,
      },
      {
        text: "Stop typing. Only one save is sent, with all your text.",
        done: (f) => f.saves.length === 1 && settled(f),
      },
    ],
  },
  {
    id: "click-away-saves-now",
    title: "Clicking away saves at once",
    summary: "Leaving the editor does not wait for the pause.",
    latencyMs: 300,
    failNext: "none",
    controls: [],
    steps: [
      { text: "Type a few letters at the end of Note.", done: typed },
      {
        text: "Right away, click empty page space outside the editor.",
        done: (f) => f.leaves.length > 0,
      },
      {
        text: "A save starts immediately, and no second one follows.",
        done: (f) =>
          startedRightAfter(f, f.leaves) && f.saves.length === 1 && settled(f),
      },
    ],
  },
  {
    id: "flush-button-once",
    title: "Flush saves at once, and only once",
    summary: "Flush is what leaving the editor runs.",
    latencyMs: 300,
    failNext: "none",
    controls: ["flush"],
    steps: [
      { text: "Type a few words at the end of Note.", done: typed },
      {
        text: "Click Flush at least 3 times, as fast as you can.",
        done: (f) => f.flushes.length >= 3,
      },
      {
        text: "Only one save is sent.",
        done: (f) => f.saves.length === 1 && settled(f),
      },
    ],
  },
  {
    id: "tab-hidden-saves",
    title: "Switching tabs saves",
    summary: "Best effort: the browser may still freeze the page.",
    latencyMs: 300,
    failNext: "none",
    controls: [],
    steps: [
      { text: "Type a few words at the end of Note.", done: typed },
      {
        text: "Right away, switch to another browser tab, wait a couple of seconds, and come back.",
        done: (f) =>
          f.hidden.length > 0 &&
          last(f.hidden) > f.edits[0] &&
          f.shown.some((at) => at > last(f.hidden)),
      },
      {
        text: "The save started the moment the tab was hidden.",
        done: (f) => startedRightAfter(f, f.hidden) && textIsSaved(f),
      },
    ],
  },
  {
    id: "unmount-saves",
    title: "Closing the editor saves unsaved text",
    summary: "Leaving the page must not drop an edit.",
    latencyMs: 300,
    failNext: "none",
    controls: ["closeIn5s"],
    steps: [
      {
        text: "Click Close in 5 s.",
        done: (f) => f.closeScheduled.length > 0,
      },
      {
        text: "Keep typing in Note without ever stopping for a full second, until the editor disappears.",
        done: (f) => f.closed.length > 0 && startedRightAfter(f, f.closed),
      },
      {
        text: "Click Open editor. Your text is there.",
        done: (f) =>
          f.editorOpen &&
          f.opens >= 2 &&
          f.server.version >= 2 &&
          textIsSaved(f),
      },
    ],
  },
  {
    id: "slow-save-then-more-typing",
    title: "Typing during a slow save sends one more",
    summary: "Saves never overlap. The newest text goes out afterwards.",
    latencyMs: 5000,
    failNext: "none",
    controls: [],
    steps: [
      {
        text: "Type a few words at the end of Note and wait for Saving...",
        done: (f) => f.saves.length > 0,
      },
      {
        text: "While it is still saving, type a bit more.",
        done: (f) => {
          const first = f.saves[0];
          return f.edits.some(
            (at) =>
              at > first.startedAt &&
              (first.finishedAt === undefined || at < first.finishedAt),
          );
        },
      },
      {
        text: "Wait. When the first save ends, one more save sends all your text.",
        done: (f) => f.saves.length >= 2 && settled(f),
      },
    ],
  },
  {
    id: "undo-sends-nothing",
    title: "Typing a change and undoing it sends nothing",
    summary: "Text back to what the server holds means nothing to save.",
    latencyMs: 300,
    failNext: "none",
    controls: [],
    steps: [
      {
        text: "Type one letter at the end of Note.",
        done: (f) => !textIsSample(f),
      },
      {
        text: "Right away, press Backspace to remove it.",
        done: (f) => textIsSample(f) && f.edits.length >= 2,
      },
      {
        text: "Wait 3 seconds. Nothing is sent.",
        done: (f) => f.saves.length === 0 && idleFor(f, 3000),
      },
    ],
  },
  {
    id: "untouched-sends-nothing",
    title: "Opening and closing untouched sends nothing",
    summary: "No typing, no save, even with Flush and a close.",
    latencyMs: 300,
    failNext: "none",
    controls: ["flush", "close"],
    steps: [
      {
        text: "Click Flush without typing anything.",
        done: (f) => f.flushes.length > 0,
      },
      {
        text: "Click Close editor, then Open editor.",
        done: (f) => f.closed.length > 0 && f.editorOpen && f.opens >= 2,
      },
      {
        text: "Wait 3 seconds. Nothing is sent.",
        done: (f) => f.saves.length === 0 && idleFor(f, 3000),
      },
    ],
  },
  failThenRetry(
    "failed-save-returned",
    "A rejected save shows an error and is retried",
    "The first save is rejected by the fake server.",
    "returned",
  ),
  failThenRetry(
    "failed-save-thrown",
    "A save that crashes is handled the same way",
    "The first save throws an error.",
    "thrown",
  ),
  {
    id: "flush-after-failure",
    title: "Flush after a failure sends the text again",
    summary: "The first save is rejected. Flush tries again.",
    latencyMs: 300,
    failNext: "returned",
    controls: ["flush"],
    steps: [
      { text: "Type a few words at the end of Note.", done: typed },
      {
        text: "Wait until the status says Could not save.",
        done: (f) => sawStatus(f, "error"),
      },
      {
        text: "Click Flush.",
        done: (f) => f.flushes.some((at) => at > (errorAt(f) ?? Infinity)),
      },
      {
        text: "The text is sent again and saved.",
        done: (f) => acceptedAfter(f, errorAt(f)) && textIsSaved(f),
      },
    ],
  },
  {
    id: "error-clears-on-undo",
    title: "The error clears when the text goes back",
    summary: "Nothing is unsaved any more, so there is nothing to retry.",
    latencyMs: 300,
    failNext: "returned",
    controls: [],
    steps: [
      {
        text: "Type one letter at the end of Note and wait until the status says Could not save.",
        done: (f) => sawStatus(f, "error"),
      },
      {
        text: "Press Backspace to remove the letter.",
        done: (f) =>
          textIsSaved(f) && f.edits.some((at) => at > (errorAt(f) ?? Infinity)),
      },
      {
        text: "The status goes back to Idle and nothing more is sent.",
        done: (f) => f.status === "idle" && f.saves.length === 1,
      },
    ],
  },
  {
    id: "empty-note-rejected",
    title: "Emptying the whole note is rejected",
    summary: "Like the real server: a note needs a title or a note.",
    latencyMs: 300,
    failNext: "none",
    controls: [],
    steps: [
      {
        text: "Delete everything in Title and in Note.",
        done: isBlank,
      },
      {
        text: "Wait. The server rejects it, and the status says Could not save.",
        done: (f) => sawStatus(f, "error"),
      },
      {
        text: "Type a letter. It saves normally.",
        done: (f) =>
          !isBlank(f) && acceptedAfter(f, errorAt(f)) && textIsSaved(f),
      },
    ],
  },
  {
    id: "close-during-save",
    title: "Closing the editor during a save still finishes it",
    summary: "The save lands even though there is no screen left.",
    latencyMs: 5000,
    failNext: "none",
    controls: ["close"],
    steps: [
      {
        text: "Type a few words at the end of Note and wait for Saving...",
        done: (f) => f.saves.length > 0 && saveIsRunning(f),
      },
      {
        text: "Click Close editor while it is still saving.",
        done: closedWhileSaving,
      },
      {
        text: "Wait. The save still finishes and Server copy updates.",
        done: (f) => f.server.version >= 2,
      },
      {
        text: "Click Open editor. Your text is there.",
        done: (f) => f.editorOpen && f.opens >= 2 && textIsSaved(f),
      },
    ],
  },
];
