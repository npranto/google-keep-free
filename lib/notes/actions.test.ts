import { beforeEach, describe, expect, it, vi } from "vitest";

import { BODY_MAX, TITLE_MAX } from "./validation";

// The database and the identity lookup are the system boundaries. Replacing
// them whole also keeps lib/env.ts out of this test, so it runs with no env.
const { insertMock, getOwnerIdMock } = vi.hoisted(() => ({
  insertMock: vi.fn(),
  getOwnerIdMock: vi.fn(),
}));

vi.mock("@/lib/db", () => ({ db: { insert: insertMock } }));
vi.mock("@/lib/auth/current-owner", () => ({ getOwnerId: getOwnerIdMock }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { createNote } from "./actions";

beforeEach(() => {
  insertMock.mockReset();
  getOwnerIdMock.mockReset();
});

describe("createNote with an input that fails validation", () => {
  const rejected: [string, unknown][] = [
    ["nothing", {}],
    ["an empty title and body", { title: "", body: "" }],
    ["whitespace only", { title: "  \n\t", body: " " }],
    ["a title over the limit", { title: "a".repeat(TITLE_MAX + 1) }],
    ["a body over the limit", { body: "a".repeat(BODY_MAX + 1) }],
    ["a value that is not an object", "hello"],
  ];

  it.each(rejected)(
    "returns a validation error and touches nothing for %s",
    async (_name, input) => {
      const result = await createNote(input);

      expect(result).toEqual({
        ok: false,
        error: { kind: "validation", message: expect.any(String) },
      });
      expect(insertMock).not.toHaveBeenCalled();
      expect(getOwnerIdMock).not.toHaveBeenCalled();
    },
  );
});

describe("createNote without a signed-in Owner", () => {
  it("inserts nothing and lets the sign-in redirect through", async () => {
    // getOwnerId redirects by throwing; the action must not swallow it.
    getOwnerIdMock.mockRejectedValue(new Error("NEXT_REDIRECT:/sign-in"));

    await expect(createNote({ title: "hello" })).rejects.toThrow(
      "NEXT_REDIRECT:/sign-in",
    );
    expect(insertMock).not.toHaveBeenCalled();
  });
});
