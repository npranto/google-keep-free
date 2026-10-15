import { EmptyState } from "@/components/notes/EmptyState";
import { NoteGrid } from "@/components/notes/NoteGrid";
import { toNoteCard } from "@/lib/notes/card";
import { getActiveNotes } from "@/lib/notes/queries";

export default async function HomePage() {
  // getActiveNotes redirects by throwing when there is no session, so it is not
  // wrapped in a try/catch. toNoteCard keeps the full body and Owner id out of
  // what the grid receives.
  const cards = (await getActiveNotes()).map(toNoteCard);

  if (cards.length === 0) return <EmptyState />;
  return <NoteGrid notes={cards} />;
}
