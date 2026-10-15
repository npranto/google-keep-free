import type { notes } from "@/lib/db/schema";

type Note = typeof notes.$inferSelect;

// The most body text a card receives. The grid shows a few lines, so the rest
// of a 20,000-character body is dropped here instead of being rendered.
export const PREVIEW_MAX = 500;

// What a card needs, and nothing more: no full body, no Owner id. Every view
// passes its rows through toNoteCard, and NoteGrid accepts only this shape, so
// a raw row cannot reach it by mistake.
export type NoteCardData = Pick<Note, "id" | "title" | "color" | "pinned"> & {
  preview: string;
};

export function toNoteCard(note: Note): NoteCardData {
  return {
    id: note.id,
    title: note.title,
    preview: previewOf(note.body),
    color: note.color,
    pinned: note.pinned,
  };
}

// Cuts by code points, so an emoji is never split in half.
function previewOf(body: string): string {
  if (body.length <= PREVIEW_MAX) return body;
  const points = Array.from(body);
  if (points.length <= PREVIEW_MAX) return body;
  return points.slice(0, PREVIEW_MAX).join("") + "…";
}
