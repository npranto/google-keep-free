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

import { createNote } from "./actions";
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
