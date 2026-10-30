import { describe, expect, it } from "vitest";

import {
  BODY_MAX,
  TITLE_MAX,
  createNoteSchema,
  updateNoteSchema,
} from "./validation";

describe("createNoteSchema", () => {
  it("accepts a title of exactly the limit", () => {
    const result = createNoteSchema.safeParse({ title: "a".repeat(300) });
    expect(result.success).toBe(true);
  });

  it("rejects a title one over the limit", () => {
    const result = createNoteSchema.safeParse({
      title: "a".repeat(301),
    });
    expect(result.success).toBe(false);
  });

  it("accepts a body of exactly the limit", () => {
    const result = createNoteSchema.safeParse({ body: "a".repeat(20000) });
    expect(result.success).toBe(true);
  });

  it("rejects a body one over the limit", () => {
    const result = createNoteSchema.safeParse({
      body: "a".repeat(20001),
    });
    expect(result.success).toBe(false);
  });

  it("exports the limits from the data model", () => {
    expect(TITLE_MAX).toBe(300);
    expect(BODY_MAX).toBe(20000);
  });

  it.each([
    ["no input", {}],
    ["empty strings", { title: "", body: "" }],
    ["whitespace only", { title: "   ", body: "\n\t " }],
  ])("rejects an empty Note: %s", (_name, input) => {
    expect(createNoteSchema.safeParse(input).success).toBe(false);
  });

  it("accepts content in one field only", () => {
    expect(createNoteSchema.safeParse({ title: "Milk" }).success).toBe(true);
    expect(createNoteSchema.safeParse({ body: "Milk" }).success).toBe(true);
    expect(
      createNoteSchema.safeParse({ title: "   ", body: "Milk" }).success,
    ).toBe(true);
  });

  it("keeps the text as typed, without trimming", () => {
    const result = createNoteSchema.parse({ title: "  Milk ", body: "x\n" });
    expect(result).toEqual({ title: "  Milk ", body: "x\n" });
  });

  it("drops a client-supplied ownerId", () => {
    const result = createNoteSchema.parse({ title: "a", ownerId: "victim" });
    expect(result).not.toHaveProperty("ownerId");
  });

  it.each([
    ["title", { title: "a\u0000b" }],
    ["body", { body: "a\u0000b" }],
  ])(
    "rejects a NUL character in the %s, which Postgres cannot store",
    (_name, input) => {
      expect(createNoteSchema.safeParse(input).success).toBe(false);
    },
  );
});

describe("updateNoteSchema", () => {
  const id = "0b0b8c1e-5f7a-4b1e-9a55-1c2d3e4f5a6b";
  const valid = { id, title: "Milk", body: "2 litres", version: 3 };

  it("accepts an id, a title, a body and a version", () => {
    expect(updateNoteSchema.parse(valid)).toEqual(valid);
  });

  it("keeps the text as typed, without trimming", () => {
    const result = updateNoteSchema.parse({
      ...valid,
      title: "  Milk ",
      body: "x\n",
    });
    expect(result).toMatchObject({ title: "  Milk ", body: "x\n" });
  });

  it("accepts content in one field only", () => {
    expect(updateNoteSchema.safeParse({ ...valid, title: "" }).success).toBe(
      true,
    );
    expect(updateNoteSchema.safeParse({ ...valid, body: "" }).success).toBe(
      true,
    );
  });

  it.each([
    ["empty strings", { title: "", body: "" }],
    ["whitespace only", { title: "   ", body: "\n\t " }],
  ])("rejects an empty Note: %s", (_name, fields) => {
    expect(updateNoteSchema.safeParse({ ...valid, ...fields }).success).toBe(
      false,
    );
  });

  it.each(["title", "body"] as const)(
    "rejects a missing %s instead of defaulting it, so a partial payload cannot blank a Note",
    (field) => {
      const partial: Record<string, unknown> = { ...valid };
      delete partial[field];
      expect(updateNoteSchema.safeParse(partial).success).toBe(false);
    },
  );

  it("accepts a title and a body of exactly the limits", () => {
    const result = updateNoteSchema.safeParse({
      ...valid,
      title: "a".repeat(TITLE_MAX),
      body: "a".repeat(BODY_MAX),
    });
    expect(result.success).toBe(true);
  });

  it.each([
    ["title", { title: "a".repeat(TITLE_MAX + 1) }],
    ["body", { body: "a".repeat(BODY_MAX + 1) }],
  ])("rejects a %s one over the limit", (_name, fields) => {
    expect(updateNoteSchema.safeParse({ ...valid, ...fields }).success).toBe(
      false,
    );
  });

  it.each([
    ["title", { title: "a\u0000b" }],
    ["body", { body: "a\u0000b" }],
  ])("rejects a NUL character in the %s", (_name, fields) => {
    expect(updateNoteSchema.safeParse({ ...valid, ...fields }).success).toBe(
      false,
    );
  });

  it.each([
    ["no id", { id: undefined }],
    ["an id that is not a uuid", { id: "not-a-uuid" }],
    ["no version", { version: undefined }],
    ["a version of zero", { version: 0 }],
    ["a negative version", { version: -1 }],
    ["a fractional version", { version: 1.5 }],
    ["a version that is a string", { version: "3" }],
    // notes.version is a 32-bit integer: Postgres would throw on this.
    ["a version above the 32-bit integer column", { version: 2147483648 }],
  ])("rejects %s", (_name, fields) => {
    expect(updateNoteSchema.safeParse({ ...valid, ...fields }).success).toBe(
      false,
    );
  });

  it("accepts the largest version the column can hold", () => {
    expect(
      updateNoteSchema.safeParse({ ...valid, version: 2147483647 }).success,
    ).toBe(true);
  });

  it("drops a client-supplied ownerId", () => {
    const result = updateNoteSchema.parse({ ...valid, ownerId: "victim" });
    expect(result).not.toHaveProperty("ownerId");
  });
});
