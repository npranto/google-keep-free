import { describe, expect, it } from "vitest";

import { BODY_MAX, TITLE_MAX, createNoteSchema } from "./validation";

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
