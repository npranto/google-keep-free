import { describe, expect, it } from "vitest";

import type { notes } from "@/lib/db/schema";

import { PREVIEW_MAX, toNoteCard } from "./card";

type Note = typeof notes.$inferSelect;

function note(overrides: Partial<Note> = {}): Note {
  return {
    id: "6f1b8c52-0d0e-4b43-9c3a-0a0f4f1f9a11",
    ownerId: "user_123",
    title: "Groceries",
    body: "Milk and eggs",
    state: "active",
    color: "default",
    pinned: false,
    version: 1,
    createdAt: new Date("2026-10-14T09:00:00Z"),
    updatedAt: new Date("2026-10-14T09:00:00Z"),
    trashedAt: null,
    ...overrides,
  };
}

describe("toNoteCard", () => {
  it("carries only the card fields, never the Owner id, version or dates", () => {
    const card = toNoteCard(note({ color: "sage", pinned: true }));

    expect(card).toEqual({
      id: "6f1b8c52-0d0e-4b43-9c3a-0a0f4f1f9a11",
      title: "Groceries",
      preview: "Milk and eggs",
      color: "sage",
      pinned: true,
    });
  });

  it("returns an empty preview for an empty body", () => {
    expect(toNoteCard(note({ body: "" })).preview).toBe("");
  });

  it("keeps a body of exactly the limit whole", () => {
    const body = "a".repeat(PREVIEW_MAX);

    expect(toNoteCard(note({ body })).preview).toBe(body);
  });

  it("cuts a body one over the limit and marks the cut", () => {
    const body = "a".repeat(PREVIEW_MAX + 1);

    expect(toNoteCard(note({ body })).preview).toBe(
      "a".repeat(PREVIEW_MAX) + "…",
    );
  });

  it("never ships the full 20,000-character body", () => {
    const body = "word ".repeat(4000);

    expect(toNoteCard(note({ body })).preview.length).toBeLessThanOrEqual(
      PREVIEW_MAX + 1,
    );
  });

  it("does not split an emoji at the cut", () => {
    const body = "a".repeat(PREVIEW_MAX - 1) + "😀" + "tail";

    const { preview } = toNoteCard(note({ body }));

    expect(preview).toBe("a".repeat(PREVIEW_MAX - 1) + "😀…");
  });
});
