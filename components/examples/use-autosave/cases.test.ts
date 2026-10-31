import { describe, expect, it } from "vitest";

import {
  advance,
  CASES,
  createFacts,
  findProblem,
  SAMPLE_NOTE,
  type Facts,
  type Save,
} from "./cases";

const caseById = (id: string) => {
  const found = CASES.find((testCase) => testCase.id === id);
  if (!found) throw new Error(`no case ${id}`);
  return found;
};

// A save of `body` that started at `startedAt` and was accepted 300 ms later.
function acceptedSave(facts: Facts, body: string, startedAt: number): Save {
  const save: Save = {
    values: { ...SAMPLE_NOTE, body },
    serverBefore: { title: facts.server.title, body: facts.server.body },
    startedAt,
    finishedAt: startedAt + 300,
    outcome: "accepted",
    overlapped: false,
  };
  facts.saves.push(save);
  facts.server = { ...save.values, version: facts.server.version + 1 };
  return save;
}

describe("cases", () => {
  it("each case has a unique id and at least one step", () => {
    const ids = CASES.map((testCase) => testCase.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const testCase of CASES)
      expect(testCase.steps.length).toBeGreaterThan(0);
  });

  it("a pause after typing: ticks each step as it happens and passes at the end", () => {
    const testCase = caseById("pause-saves-once");
    const facts = createFacts();

    facts.now = 0;
    expect(advance(testCase, facts, 0).done).toBe(0);

    // Types at 100 ms: step 1.
    facts.body = "Hike on Saturday!";
    facts.edits.push(100);
    facts.now = 100;
    expect(advance(testCase, facts, 0).done).toBe(1);

    // The save starts 1 s after the last keystroke: step 2.
    acceptedSave(facts, facts.body, 1100);
    facts.statusLog.push({ status: "idle", at: 0 });
    facts.now = 1500;
    expect(advance(testCase, facts, 1).done).toBe(2);

    // Saving, Saved, then Idle: step 3, so the case passes.
    facts.statusLog.push(
      { status: "saving", at: 1100 },
      { status: "saved", at: 1400 },
      { status: "idle", at: 3400 },
    );
    facts.now = 3400;
    expect(advance(testCase, facts, 2).done).toBe(testCase.steps.length);
  });

  it("a save that starts too early does not tick the pause step", () => {
    const testCase = caseById("pause-saves-once");
    const facts = createFacts();
    facts.body = "Hike on Saturday!";
    facts.edits.push(100);
    acceptedSave(facts, facts.body, 250); // e.g. you clicked away
    facts.now = 5000;
    expect(advance(testCase, facts, 1).done).toBe(1);
  });

  it("undo: waiting does not pass when a save was sent in between", () => {
    const testCase = caseById("undo-sends-nothing");
    const facts = createFacts();
    facts.body = SAMPLE_NOTE.body; // text is back to the saved text
    facts.edits.push(100, 200);
    acceptedSave(facts, "Hike on Saturdayx", 150);
    facts.lastEventAt = 500;
    facts.now = 9000;
    expect(advance(testCase, facts, 2).done).toBe(2);
  });
});

describe("findProblem", () => {
  it("is quiet for a normal save", () => {
    const facts = createFacts();
    acceptedSave(facts, "Hike on Sunday", 100);
    expect(findProblem(facts)).toBeUndefined();
  });

  it("reports a save that started while another was running", () => {
    const facts = createFacts();
    acceptedSave(facts, "Hike on Sunday", 100).overlapped = true;
    expect(findProblem(facts)).toMatch(/while another save was still running/);
  });

  it("reports a save of text the server already had", () => {
    const facts = createFacts();
    acceptedSave(facts, SAMPLE_NOTE.body, 100);
    expect(findProblem(facts)).toMatch(/already had/);
  });

  it("stops a case from passing when there is a problem", () => {
    const testCase = caseById("pause-saves-once");
    const facts = createFacts();
    facts.edits.push(0);
    acceptedSave(facts, SAMPLE_NOTE.body, 1000);
    expect(advance(testCase, facts, 0)).toMatchObject({
      done: 0,
      problem: expect.stringContaining("already had"),
    });
  });
});
