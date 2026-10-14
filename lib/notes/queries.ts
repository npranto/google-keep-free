import { and, desc, eq, type SQL } from "drizzle-orm";

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
