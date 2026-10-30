import { randomUUID } from "node:crypto";

import { eq, inArray } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Real database. Identity is the only seam: getOwnerId would need a Clerk
// session. next/cache is mocked because revalidatePath throws outside a Next
// request. Run with `npm run test:integration`.
const { getOwnerIdMock, revalidatePathMock } = vi.hoisted(() => ({
  getOwnerIdMock: vi.fn(),
  revalidatePathMock: vi.fn(),
}));

vi.mock("@/lib/auth/current-owner", () => ({ getOwnerId: getOwnerIdMock }));
vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }));

import { db } from "@/lib/db";
import { notes } from "@/lib/db/schema";

import { createNote, updateNote } from "./actions";
import { getActiveNotes } from "./queries";
import { BODY_MAX, TITLE_MAX } from "./validation";

// Fresh Owners per run, so these rows can never mix with a real user's, a row
// left by an earlier run cannot change a result, and the cleanup below can only
// ever match rows this file wrote. otherOwner is the id a client might send.
const testOwner = `test_${randomUUID()}`;
const otherOwner = `test_other_${randomUUID()}`;

const rowsOf = (ownerId: string) =>
  db.select().from(notes).where(eq(notes.ownerId, ownerId));

beforeEach(() => {
  getOwnerIdMock.mockReset();
  getOwnerIdMock.mockResolvedValue(testOwner);
  revalidatePathMock.mockReset();
});

afterEach(async () => {
  await db.delete(notes).where(inArray(notes.ownerId, [testOwner, otherOwner]));
});

describe("createNote", () => {
  it("inserts one active Note owned by the caller and returns its id and version", async () => {
    const result = await createNote({ title: "Groceries", body: "milk, eggs" });

    if (!result.ok) throw new Error("expected createNote to succeed");
    expect(result.data).toEqual({ id: expect.any(String), version: 1 });

    const rows = await rowsOf(testOwner);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      id: result.data.id,
      ownerId: testOwner,
      title: "Groceries",
      body: "milk, eggs",
      state: "active",
      version: 1,
    });
  });

  it("ignores an ownerId in the input", async () => {
    const result = await createNote({ title: "mine", ownerId: otherOwner });

    expect(result.ok).toBe(true);
    expect(await rowsOf(otherOwner)).toHaveLength(0);
    expect(await rowsOf(testOwner)).toHaveLength(1);
  });

  it("inserts no row for a whitespace-only draft", async () => {
    const result = await createNote({ title: "  ", body: "\n\t" });

    expect(result).toMatchObject({ ok: false, error: { kind: "validation" } });
    expect(await rowsOf(testOwner)).toHaveLength(0);
  });

  it("accepts a title and a body of exactly the limits", async () => {
    const result = await createNote({
      title: "t".repeat(TITLE_MAX),
      body: "b".repeat(BODY_MAX),
    });

    expect(result.ok).toBe(true);
    const [row] = await rowsOf(testOwner);
    expect(row.title).toHaveLength(TITLE_MAX);
    expect(row.body).toHaveLength(BODY_MAX);
  });

  it.each([
    ["a title", { title: "t".repeat(TITLE_MAX + 1) }],
    ["a body", { body: "b".repeat(BODY_MAX + 1) }],
  ])("rejects %s one character over the limit", async (_name, input) => {
    const result = await createNote(input);

    expect(result).toMatchObject({ ok: false, error: { kind: "validation" } });
    expect(await rowsOf(testOwner)).toHaveLength(0);
  });

  it("revalidates the notes list after a Note is created", async () => {
    await createNote({ title: "x" });

    expect(revalidatePathMock).toHaveBeenCalledWith("/");
  });

  it("does not revalidate when the input is rejected", async () => {
    await createNote({ title: "", body: "" });

    expect(revalidatePathMock).not.toHaveBeenCalled();
  });
});

describe("updateNote", () => {
  // Seeds with a fixed old timestamp so a bumped updated_at is unmistakable.
  const seedNote = async (values: Partial<typeof notes.$inferInsert> = {}) => {
    const [row] = await db
      .insert(notes)
      .values({
        ownerId: testOwner,
        title: "before",
        body: "before body",
        updatedAt: new Date("2026-01-01"),
        ...values,
      })
      .returning();
    return row;
  };
  const rowOf = async (id: string) =>
    (await db.select().from(notes).where(eq(notes.id, id)))[0];

  it("saves the title and body, bumps version and updated_at, and returns the new version", async () => {
    const note = await seedNote();

    const result = await updateNote({
      id: note.id,
      title: "after",
      body: "after body",
      version: note.version,
    });

    expect(result).toEqual({
      ok: true,
      data: { id: note.id, version: note.version + 1 },
    });
    const row = await rowOf(note.id);
    expect(row).toMatchObject({
      title: "after",
      body: "after body",
      version: note.version + 1,
      ownerId: testOwner,
    });
    expect(row.updatedAt.getTime()).toBeGreaterThan(note.updatedAt.getTime());
  });

  it("changes nothing but title, body, version and updated_at", async () => {
    const note = await seedNote({ pinned: true, color: "coral" });

    await updateNote({
      id: note.id,
      title: "after",
      body: "",
      version: note.version,
    });

    expect(await rowOf(note.id)).toMatchObject({
      state: "active",
      pinned: true,
      color: "coral",
      createdAt: note.createdAt,
      trashedAt: null,
    });
  });

  it("applies two saves in a row when the second carries the returned version", async () => {
    const note = await seedNote();

    const first = await updateNote({
      id: note.id,
      title: "one",
      body: "",
      version: note.version,
    });
    if (!first.ok) throw new Error("expected the first save to succeed");
    const second = await updateNote({
      id: note.id,
      title: "two",
      body: "",
      version: first.data.version,
    });

    expect(second).toEqual({
      ok: true,
      data: { id: note.id, version: note.version + 2 },
    });
    expect((await rowOf(note.id)).title).toBe("two");
  });

  it("rejects a stale version and leaves the Note as the newer save wrote it", async () => {
    const note = await seedNote();
    await updateNote({
      id: note.id,
      title: "newer",
      body: "",
      version: note.version,
    });

    const result = await updateNote({
      id: note.id,
      title: "stale",
      body: "",
      version: note.version,
    });

    expect(result).toMatchObject({ ok: false, error: { kind: "not_found" } });
    expect(await rowOf(note.id)).toMatchObject({
      title: "newer",
      version: note.version + 1,
    });
  });

  it("lets only one of two saves with the same version win, and keeps the winner's text", async () => {
    // Checks the outcome, not the interleaving: it holds whether the two calls
    // overlap or run back to back. The single statement is what makes the
    // check atomic, and "rejects a stale version" above guards the predicate.
    const note = await seedNote();
    const save = (title: string) =>
      updateNote({ id: note.id, title, body: "", version: note.version });

    const results = await Promise.all([save("a"), save("b")]);

    const winners = results.flatMap((r, i) => (r.ok ? [["a", "b"][i]] : []));
    expect(winners).toHaveLength(1);
    expect(results.filter((r) => !r.ok)).toHaveLength(1);
    expect(await rowOf(note.id)).toMatchObject({
      title: winners[0],
      version: note.version + 1,
    });
  });

  it("rejects another Owner's Note with the same error as a missing id", async () => {
    const theirs = await seedNote({ ownerId: otherOwner });

    const foreign = await updateNote({
      id: theirs.id,
      title: "hijacked",
      body: "",
      version: theirs.version,
    });
    const missing = await updateNote({
      id: randomUUID(),
      title: "nothing",
      body: "",
      version: 1,
    });

    expect(foreign).toEqual(missing);
    expect(foreign).toMatchObject({ ok: false, error: { kind: "not_found" } });
    expect(await rowOf(theirs.id)).toMatchObject({
      title: "before",
      version: theirs.version,
    });
  });

  it("ignores an ownerId in the input", async () => {
    const theirs = await seedNote({ ownerId: otherOwner });

    const result = await updateNote({
      id: theirs.id,
      title: "hijacked",
      body: "",
      version: theirs.version,
      ownerId: otherOwner,
    });

    expect(result.ok).toBe(false);
    expect((await rowOf(theirs.id)).title).toBe("before");
  });

  it("rejects a Trashed Note and leaves it unchanged", async () => {
    const note = await seedNote({ state: "trashed", trashedAt: new Date() });

    const result = await updateNote({
      id: note.id,
      title: "edited in the trash",
      body: "",
      version: note.version,
    });

    expect(result).toMatchObject({ ok: false, error: { kind: "not_found" } });
    expect(await rowOf(note.id)).toMatchObject({
      title: "before",
      version: note.version,
    });
  });

  it("saves an Archived Note", async () => {
    const note = await seedNote({ state: "archived" });

    const result = await updateNote({
      id: note.id,
      title: "after",
      body: "",
      version: note.version,
    });

    expect(result.ok).toBe(true);
    expect(await rowOf(note.id)).toMatchObject({
      title: "after",
      state: "archived",
    });
  });

  it.each([
    ["both fields empty", { title: "", body: "" }],
    ["both fields whitespace", { title: " ", body: "\n" }],
    ["a title over the limit", { title: "t".repeat(TITLE_MAX + 1), body: "x" }],
    ["a body over the limit", { title: "x", body: "b".repeat(BODY_MAX + 1) }],
    ["a NUL character", { title: "x", body: "a\u0000b" }],
  ])("rejects %s and writes nothing", async (_name, fields) => {
    const note = await seedNote();

    const result = await updateNote({
      id: note.id,
      version: note.version,
      ...fields,
    });

    expect(result).toMatchObject({ ok: false, error: { kind: "validation" } });
    expect(await rowOf(note.id)).toMatchObject({
      title: "before",
      body: "before body",
      version: note.version,
    });
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });

  it("accepts a title and a body of exactly the limits", async () => {
    const note = await seedNote();

    const result = await updateNote({
      id: note.id,
      title: "t".repeat(TITLE_MAX),
      body: "b".repeat(BODY_MAX),
      version: note.version,
    });

    expect(result.ok).toBe(true);
  });

  it("revalidates the notes list after a save, and not after a rejected one", async () => {
    const note = await seedNote();

    await updateNote({ id: note.id, title: "x", body: "", version: 99 });
    expect(revalidatePathMock).not.toHaveBeenCalled();

    await updateNote({
      id: note.id,
      title: "x",
      body: "",
      version: note.version,
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/");
  });
});

describe("getActiveNotes", () => {
  const seed = (values: typeof notes.$inferInsert) =>
    db.insert(notes).values(values);

  it("returns only the caller's Notes, whichever Owner is signed in", async () => {
    await seed({ ownerId: testOwner, title: "mine" });
    await seed({ ownerId: otherOwner, title: "theirs" });

    const mine = await getActiveNotes();
    expect(mine.map((n) => n.title)).toEqual(["mine"]);

    getOwnerIdMock.mockResolvedValue(otherOwner);
    const theirs = await getActiveNotes();
    expect(theirs.map((n) => n.title)).toEqual(["theirs"]);
  });

  it("leaves out archived and trashed Notes", async () => {
    await seed({ ownerId: testOwner, title: "active", state: "active" });
    await seed({ ownerId: testOwner, title: "archived", state: "archived" });
    await seed({ ownerId: testOwner, title: "trashed", state: "trashed" });

    const active = await getActiveNotes();
    expect(active.map((n) => n.title)).toEqual(["active"]);
  });

  it("lists pinned Notes first, then most recently updated first", async () => {
    // Inserted in neither the expected order nor its reverse, and an old
    // pinned Note must still outrank a newer unpinned one.
    await seed({
      ownerId: testOwner,
      title: "unpinned old",
      updatedAt: new Date("2026-02-01"),
    });
    await seed({
      ownerId: testOwner,
      title: "pinned old",
      pinned: true,
      updatedAt: new Date("2026-01-01"),
    });
    await seed({
      ownerId: testOwner,
      title: "unpinned new",
      updatedAt: new Date("2026-04-01"),
    });
    await seed({
      ownerId: testOwner,
      title: "pinned new",
      pinned: true,
      updatedAt: new Date("2026-03-01"),
    });

    const active = await getActiveNotes();
    expect(active.map((n) => n.title)).toEqual([
      "pinned new",
      "pinned old",
      "unpinned new",
      "unpinned old",
    ]);
  });

  it("keeps a stable order for Notes with the same pin and update time", async () => {
    // uuid compares bytewise, which matches sorting the canonical hex strings.
    const [lowId, highId] = [randomUUID(), randomUUID()].sort();
    const updatedAt = new Date("2026-05-01");
    await seed({ ownerId: testOwner, id: lowId, title: "low id", updatedAt });
    await seed({ ownerId: testOwner, id: highId, title: "high id", updatedAt });

    const active = await getActiveNotes();
    expect(active.map((n) => n.title)).toEqual(["high id", "low id"]);
  });

  it("runs no query when there is no session", async () => {
    getOwnerIdMock.mockRejectedValue(new Error("NEXT_REDIRECT"));
    const selectSpy = vi.spyOn(db, "select");

    try {
      await expect(getActiveNotes()).rejects.toThrow("NEXT_REDIRECT");
      expect(selectSpy).not.toHaveBeenCalled();
    } finally {
      selectSpy.mockRestore();
    }
  });

  it("takes no Owner id", () => {
    // The Owner always comes from the session (ADR 0002), so a caller has no
    // argument through which to pass one. `npm run typecheck` fails here if
    // getActiveNotes gains a parameter. Add a line like this for each new
    // query that must not take an Owner id (a label id is fine).
    // @ts-expect-error getActiveNotes accepts no arguments
    const callWithOwner = () => getActiveNotes(testOwner);

    expect(callWithOwner).toBeTypeOf("function");
    expect(getActiveNotes).toHaveLength(0);
  });
});
