import type { NoteCardData } from "@/lib/notes/card";

// Read-only for now: ticket 03 makes it open the editor, 05 and 09 render
// pinned and color, and the card toolbar arrives with the actions it holds.
export function NoteCard({ note }: { note: NoteCardData }) {
  return (
    <article className="space-y-2 rounded-lg border bg-card p-4 text-card-foreground transition-shadow hover:shadow-sm">
      {note.title.trim() && (
        <h2 className="text-sm font-medium wrap-break-word">{note.title}</h2>
      )}
      {note.preview.trim() && (
        <p className="line-clamp-10 text-sm wrap-break-word whitespace-pre-line">
          {note.preview}
        </p>
      )}
    </article>
  );
}
