import { and, desc, eq, type SQL } from "drizzle-orm";
import { z } from "zod";

import { getOwnerId } from "@/lib/auth/current-owner";
import { db } from "@/lib/db";
import { notes } from "@/lib/db/schema";

// The Owner-scoped list views go through here, so the Owner filter cannot be
// forgotten and no caller passes an Owner id (ADR 0002). Any other Note read
// must filter on getOwnerId() itself. The id breaks ties so equal timestamps
// keep one order. getOwnerId redirects by throwing, so it must not be wrapped
// in a try/catch.
async function selectOwnedNotes(...where: SQL[]) {
  const ownerId = await getOwnerId();
  return db
    .select()
    .from(notes)
    .where(and(eq(notes.ownerId, ownerId), ...where))
    .orderBy(desc(notes.pinned), desc(notes.updatedAt), desc(notes.id));
}

export async function getActiveNotes() {
  return selectOwnedNotes(eq(notes.state, "active"));
}

// One Note in full, for the editor: whichever state it is in, since Archived and
// Trashed Notes open in the same dialog. A missing id, another Owner's Note and
// a malformed id all come back as undefined, so the caller cannot tell them
// apart. The session is read first, so a malformed id still
// redirects when signed out, and a malformed id never reaches Postgres, which
// would throw on it.
export async function getOwnedNote(id: string) {
  const ownerId = await getOwnerId();
  if (!z.uuid().safeParse(id).success) return undefined;

  const [note] = await db
    .select()
    .from(notes)
    .where(and(eq(notes.ownerId, ownerId), eq(notes.id, id)));
  return note;
}
