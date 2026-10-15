import { NoteCard } from "@/components/notes/NoteCard";
import type { NoteCardData } from "@/lib/notes/card";

// Pure CSS masonry (ui-spec section 12): columns fill top to bottom, so the
// visual order is column-major, not row-major.
export function NoteGrid({ notes }: { notes: NoteCardData[] }) {
  return (
    <ul
      aria-label="Notes"
      className="columns-1 gap-4 p-4 md:columns-3 lg:columns-4"
    >
      {notes.map((note) => (
        <li key={note.id} className="mb-4 break-inside-avoid">
          <NoteCard note={note} />
        </li>
      ))}
    </ul>
  );
}
