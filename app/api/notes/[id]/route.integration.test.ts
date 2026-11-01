import { randomUUID } from "node:crypto";

import { inArray } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Real database. Identity is the only seam: getOwnerId would need a Clerk
// session. Run with `npm run test:integration`.
const { getOwnerIdMock } = vi.hoisted(() => ({ getOwnerIdMock: vi.fn() }));

vi.mock("@/lib/auth/current-owner", () => ({ getOwnerId: getOwnerIdMock }));

import { db } from "@/lib/db";
import { notes } from "@/lib/db/schema";
import { PREVIEW_MAX } from "@/lib/notes/card";
import { BODY_MAX } from "@/lib/notes/validation";

import { GET } from "./route";

// Fresh Owners per run, so these rows can never mix with a real user's and the
// cleanup below can only ever match rows this file wrote.
const testOwner = `test_${randomUUID()}`;
const otherOwner = `test_other_${randomUUID()}`;

const seedNote = async (values: Partial<typeof notes.$inferInsert> = {}) => {
  const [row] = await db
    .insert(notes)
    .values({ ownerId: testOwner, title: "Groceries", body: "milk", ...values })
    .returning();
  return row;
};

// The Route Handler is called the way Next calls it: a Request and a params
// promise.
const read = (id: string) =>
  GET(new Request(`http://localhost/api/notes/${id}`), {
    params: Promise.resolve({ id }),
  });

beforeEach(() => {
  getOwnerIdMock.mockReset();
  getOwnerIdMock.mockResolvedValue(testOwner);
});

afterEach(async () => {
  await db.delete(notes).where(inArray(notes.ownerId, [testOwner, otherOwner]));
});

describe("GET /api/notes/[id]", () => {
  it("returns the whole title and body and the current version", async () => {
    const note = await seedNote({ title: "Long", body: "b".repeat(BODY_MAX) });
    expect(note.body.length).toBeGreaterThan(PREVIEW_MAX);

    const response = await read(note.id);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      id: note.id,
      title: "Long",
      body: "b".repeat(BODY_MAX),
      version: note.version,
    });
  });

  it("returns the Note's current version, not a fixed one", async () => {
    const note = await seedNote({ version: 7 });

    expect(await (await read(note.id)).json()).toMatchObject({ version: 7 });
  });

  it.each([["archived"], ["trashed"]] as const)(
    "returns a %s Note the caller owns",
    async (state) => {
      const note = await seedNote({
        state,
        trashedAt: state === "trashed" ? new Date() : null,
      });

      const response = await read(note.id);

      expect(response.status).toBe(200);
      expect(await response.json()).toMatchObject({ id: note.id });
    },
  );

  it("answers another Owner's Note, a missing id and a malformed id the same way", async () => {
    const theirs = await seedNote({ ownerId: otherOwner });

    const answers = await Promise.all(
      [theirs.id, randomUUID(), "not-a-uuid", "1; DROP TABLE notes"].map(
        async (id) => {
          const response = await read(id);
          return { status: response.status, body: await response.text() };
        },
      ),
    );

    expect(answers[0].status).toBe(404);
    for (const answer of answers) expect(answer).toEqual(answers[0]);
    expect(answers[0].body).not.toContain(theirs.id);
  });

  it("returns only id, title, body and version", async () => {
    const note = await seedNote({ pinned: true, color: "coral" });

    const body = await (await read(note.id)).json();

    expect(Object.keys(body).sort()).toEqual([
      "body",
      "id",
      "title",
      "version",
    ]);
  });

  it("is never stored by a shared cache", async () => {
    const note = await seedNote();

    const found = await read(note.id);
    const missing = await read(randomUUID());

    expect(found.headers.get("Cache-Control")).toBe("private, no-store");
    expect(missing.headers.get("Cache-Control")).toBe("private, no-store");
  });

  it("runs no query when there is no session", async () => {
    getOwnerIdMock.mockRejectedValue(new Error("NEXT_REDIRECT"));
    const selectSpy = vi.spyOn(db, "select");

    try {
      await expect(read(randomUUID())).rejects.toThrow("NEXT_REDIRECT");
      expect(selectSpy).not.toHaveBeenCalled();
    } finally {
      selectSpy.mockRestore();
    }
  });
});
