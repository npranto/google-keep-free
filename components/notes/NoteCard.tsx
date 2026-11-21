"use client";

import { NoteEditorDialog } from "@/components/notes/NoteEditorDialog";
import type { NoteCardData } from "@/lib/notes/card";

// Clicking anywhere on the card opens the editor. The button covers the whole
// card instead of wrapping its text, so the title and preview stay a heading
// and a paragraph. Ticket 05 and 09 render pinned and color, and the card
// toolbar arrives with the actions it holds: those buttons sit above this one.
export function NoteCard({ note }: { note: NoteCardData }) {
  const title = note.title.trim();

  return (
    <article className="relative space-y-2 rounded-lg border bg-card p-4 text-card-foreground transition-shadow hover:shadow-sm">
      {title && (
        <h2 className="text-sm font-medium wrap-break-word">{note.title}</h2>
      )}
      {note.preview.trim() && (
        <p className="line-clamp-10 text-sm wrap-break-word whitespace-pre-line">
          {note.preview}
        </p>
      )}
      <NoteEditorDialog
        noteId={note.id}
        trigger={
          <button
            type="button"
            aria-label={title ? `Open note: ${title}` : "Open note"}
            className="absolute inset-0 cursor-pointer rounded-lg outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          />
        }
      />
    </article>
  );
}
