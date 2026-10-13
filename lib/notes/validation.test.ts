import { describe, expect, it } from "vitest";

import { BODY_MAX, TITLE_MAX, createNoteSchema } from "./validation";

describe("createNoteSchema", () => {
  it("accepts a title of exactly the limit", () => {
    const result = createNoteSchema.safeParse({ title: "a".repeat(TITLE_MAX) });
    expect(result.success).toBe(true);
  });

  it("rejects a title one over the limit", () => {
    const result = createNoteSchema.safeParse({
      title: "a".repeat(TITLE_MAX + 1),
    });
    expect(result.success).toBe(false);
  });

  it("accepts a body of exactly the limit", () => {
    const result = createNoteSchema.safeParse({ body: "a".repeat(BODY_MAX) });
    expect(result.success).toBe(true);
  });

  it("rejects a body one over the limit", () => {
    const result = createNoteSchema.safeParse({
      body: "a".repeat(BODY_MAX + 1),
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
});
