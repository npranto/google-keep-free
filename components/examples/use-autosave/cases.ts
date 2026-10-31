// The test cases for the useAutosave example page. Plain data, so adding or
// changing a case never touches the page code. The journey numbers match the
// list at the top of components/notes/use-autosave.ts.
//
// Words used in the steps match the labels on the page: "Title" and "Note" (the
// editor fields), "Server copy", "Save takes", "Next save", "Flush", "Close
// editor", "Open editor" and "Set up this case".

export type FailNext = "none" | "returned" | "thrown";

// How the fake server behaves. "Set up this case" applies one of these.
export type DemoSetup = {
  latencyMs: number; // how long a save takes
  failNext: FailNext; // makes only the next save fail, then it resets
  rejectEmpty: boolean; // refuse a note with no title and no body, like the real server
};

export const DEFAULT_SETUP: DemoSetup = {
  latencyMs: 300,
  failNext: "none",
  rejectEmpty: true,
};

export type ShowcaseCase = {
  id: string;
  title: string;
  journey: number;
  setup: DemoSetup;
  steps: string[];
  expected: string[];
};

export const CASES: ShowcaseCase[] = [
  {
    id: "pause-saves-once",
    title: "Typing, then a pause, saves once",
    journey: 1,
    setup: DEFAULT_SETUP,
    steps: [
      "Click Set up this case.",
      'Click into Note and type " and a picnic".',
      "Stop typing and watch the log and the status.",
    ],
    expected: [
      "About 1 second after your last keystroke the log shows one 'Save #1 started' with your text, then 'Save #1 accepted'.",
      "The status shows Saving... and then Saved.",
      "Server copy shows your text and version 2.",
      "About 2 seconds after Saved appears, the status fades back to Idle.",
    ],
  },
  {
    id: "bursts-save-once",
    title: "Typing in bursts is one save",
    journey: 2,
    setup: DEFAULT_SETUP,
    steps: [
      "Click Set up this case.",
      "Click into Note and type a few letters.",
      "Pause for less than a second, then type a few more. Repeat three times.",
      "Stop typing.",
    ],
    expected: [
      "The log stays empty while your pauses are shorter than 1 second.",
      "Exactly one save starts, about 1 second after the last keystroke, with all of your text.",
      "Server copy goes up by one version only.",
    ],
  },
  {
    id: "click-away-saves-now",
    title: "Clicking away saves at once",
    journey: 3,
    setup: DEFAULT_SETUP,
    steps: [
      "Click Set up this case.",
      'Type "!" at the end of Note.',
      "Immediately click an empty part of the page, outside the editor box.",
    ],
    expected: [
      "The save starts right away (within a fraction of a second), not after a full second.",
      "No second save appears about 1 second later: the pending wait was cancelled.",
    ],
  },
  {
    id: "flush-button-once",
    title: "Flush saves at once, and only once",
    journey: 3,
    setup: DEFAULT_SETUP,
    steps: [
      "Click Set up this case.",
      "Type a few words into Note.",
      "Click Flush five times, as fast as you can.",
    ],
    expected: [
      "The log shows exactly one save started.",
      "The other clicks do nothing.",
      "No save follows about 1 second later.",
    ],
  },
  {
    id: "tab-hidden-saves",
    title: "Switching tabs saves",
    journey: 4,
    setup: DEFAULT_SETUP,
    steps: [
      "Click Set up this case.",
      "Type a few words into Note.",
      "Within 1 second, switch to another browser tab. Wait about 3 seconds, then come back.",
    ],
    expected: [
      "The log shows 'Tab hidden' and, at almost the same time, a save started. That is earlier than the 1 second wait would allow.",
      "The log shows 'Tab visible' when you return.",
      "Server copy holds your text. (Best effort: a browser may delay the save if it freezes the tab.)",
    ],
  },
  {
    id: "unmount-saves",
    title: "Closing the editor saves unsaved text",
    journey: 5,
    setup: DEFAULT_SETUP,
    steps: [
      "Click Set up this case.",
      "Click Close editor in 5 s.",
      "Click into Note and keep typing, without ever pausing for a full second, until the editor disappears.",
      "Click Open editor.",
    ],
    expected: [
      "When the editor disappears, the log shows a save started with the text you had typed so far, even though you never paused for 1 second.",
      "Server copy holds that text.",
      "The reopened editor shows it.",
    ],
  },
  {
    id: "slow-save-then-more-typing",
    title: "Typing during a slow save sends one more save",
    journey: 6,
    setup: { ...DEFAULT_SETUP, latencyMs: 5000 },
    steps: [
      "Click Set up this case (Save takes 5 s).",
      'Type " one" at the end of Note and wait until the log shows Save #1 started.',
      'While it runs, type " two", wait 1.5 seconds, then type " three" and wait 1.5 seconds.',
      "Keep watching until everything settles.",
    ],
    expected: [
      "While Save #1 runs, the log shows no second 'started' line and no OVERLAP warning.",
      "When Save #1 is accepted, exactly one more save starts at once, with the full newest text (one two three).",
      "Server copy ends on that text, two versions up.",
    ],
  },
  {
    id: "steady-typing-never-overlaps",
    title: "Steady typing with slow saves never overlaps",
    journey: 6,
    setup: { ...DEFAULT_SETUP, latencyMs: 3000 },
    steps: [
      "Click Set up this case (Save takes 3 s).",
      "Type steadily into Note for about 10 seconds, pausing now and then.",
      "Stop and wait for the log to settle.",
    ],
    expected: [
      "The log never shows OVERLAP: each 'started' line is followed by its accepted line before the next one starts.",
      "When it settles, Server copy matches what is in the editor.",
    ],
  },
  {
    id: "undo-sends-nothing",
    title: "Typing a change and undoing it sends nothing",
    journey: 7,
    setup: DEFAULT_SETUP,
    steps: [
      "Click Set up this case.",
      'Type "x" at the end of Note, then press Backspace.',
      "Wait 3 seconds.",
    ],
    expected: [
      "The log stays empty: no save was sent.",
      "Server copy stays on version 1.",
      "The status stays Idle.",
    ],
  },
  {
    id: "untouched-sends-nothing",
    title: "Opening and closing untouched sends nothing",
    journey: 7,
    setup: DEFAULT_SETUP,
    steps: [
      "Click Set up this case.",
      "Click Flush without typing anything.",
      "Click Close editor, then Open editor.",
      "Wait 3 seconds.",
    ],
    expected: [
      "The log stays empty: no save was sent.",
      "Server copy stays on version 1.",
    ],
  },
  {
    id: "failed-save-returned",
    title: "A rejected save shows an error and keeps the text",
    journey: 8,
    setup: { ...DEFAULT_SETUP, failNext: "returned" },
    steps: [
      "Click Set up this case (the next save will be rejected).",
      'Type " hello" at the end of Note and wait about 1.5 seconds.',
      'Then type one more character, for example "!".',
    ],
    expected: [
      "After the first pause the log shows a save started and then FAILED, and the status shows Could not save.",
      "Server copy did not change, and the editor says its text differs from Server copy.",
      "The Next save control is back on Succeeds.",
      "After the extra character, about 1 second later a new save goes out and is accepted: the status shows Saved and Server copy holds all of the text.",
    ],
  },
  {
    id: "failed-save-thrown",
    title: "A save that throws is handled the same way",
    journey: 8,
    setup: { ...DEFAULT_SETUP, failNext: "thrown" },
    steps: [
      "Click Set up this case (the next save will throw).",
      'Type " hello" at the end of Note and wait about 1.5 seconds.',
      'Then type one more character, for example "!".',
    ],
    expected: [
      "The log shows a save started and then FAILED (the save threw), and the status shows Could not save.",
      "The page keeps working: nothing is stuck and the editor still accepts typing.",
      "After the extra character, a new save goes out and is accepted, and the status shows Saved.",
    ],
  },
  {
    id: "flush-after-failure",
    title: "Flush after a failure sends the text again",
    journey: 8,
    setup: { ...DEFAULT_SETUP, failNext: "returned" },
    steps: [
      "Click Set up this case (the next save will be rejected).",
      'Type " hello" at the end of Note and wait for the status to show Could not save.',
      "Click Flush.",
    ],
    expected: [
      "The save is sent again at once and accepted.",
      "The status shows Saved, and Server copy holds the text.",
    ],
  },
  {
    id: "error-clears-on-undo",
    title: "An error clears when the text goes back to the saved text",
    journey: 8,
    setup: { ...DEFAULT_SETUP, failNext: "returned" },
    steps: [
      "Click Set up this case (the next save will be rejected).",
      'Type "x" at the end of Note and wait for the status to show Could not save.',
      "Press Backspace to remove the x.",
    ],
    expected: [
      "Within about 1 second the status goes back to Idle.",
      "No new save appears in the log.",
      "The editor says its text matches Server copy.",
    ],
  },
  {
    id: "empty-note-rejected",
    title: "Emptying the whole note is rejected, like the real server",
    journey: 8,
    setup: DEFAULT_SETUP,
    steps: [
      "Click Set up this case (Reject a note with no title and no body is on).",
      "Delete everything in Title and in Note.",
      "Wait 1.5 seconds, then type any letter into Note.",
    ],
    expected: [
      "The log shows a save started and then FAILED: a note needs a title or a body. The status shows Could not save.",
      "Server copy did not change.",
      "After you type a letter, a new save is accepted and the status shows Saved.",
    ],
  },
  {
    id: "close-during-save",
    title: "Closing the editor during a save still finishes it",
    journey: 9,
    setup: { ...DEFAULT_SETUP, latencyMs: 5000 },
    steps: [
      "Click Set up this case (Save takes 5 s).",
      'Type "!" at the end of Note and wait until the log shows Save #1 started.',
      "Click Close editor.",
      "Wait for the save to finish (about 5 seconds), then click Open editor.",
    ],
    expected: [
      "The editor disappears at once.",
      "About 5 seconds later the log shows Save #1 accepted and Server copy updates.",
      "No error appears anywhere, and the browser console stays clean (open the developer tools to check).",
      "The reopened editor shows the saved text.",
    ],
  },
];
