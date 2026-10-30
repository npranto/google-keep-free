"use server";

import { and, eq, ne, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { getOwnerId } from "@/lib/auth/current-owner";
import { db } from "@/lib/db";
import { notes } from "@/lib/db/schema";
import type { ActionResult } from "@/lib/shared/result";

import { createNoteSchema, updateNoteSchema } from "./validation";

export async function createNote(
  input: unknown,
): Promise<ActionResult<{ id: string; version: number }>> {
  const parsed = createNoteSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: { kind: "validation", message: parsed.error.issues[0].message },
    };
  }

  // The Owner comes from the session, never from the input (ADR 0002).
  // getOwnerId redirects by throwing, so it must not be wrapped in a try/catch.
  const ownerId = await getOwnerId();

  const [note] = await db
    .insert(notes)
    .values({ ...parsed.data, ownerId })
    .returning({ id: notes.id, version: notes.version });

  revalidatePath("/");
  return { ok: true, data: note };
}

// Saves one version of a Note's title and body. Debounce and queueing live in
// the client hook, so this stays a plain "save this version" call. One atomic
// statement is the whole concurrency check: it matches only if the Note is the
// Owner's, still at the version the client read, and not Trashed (read-only).
// Zero rows therefore covers a stale version, another Owner's id, a missing id
// and a Trashed Note alike, and answers all four the same so it reveals nothing
// about which one it was. Telling a stale version apart is ticket 04.
export async function updateNote(
  input: unknown,
): Promise<ActionResult<{ id: string; version: number }>> {
  const parsed = updateNoteSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: { kind: "validation", message: parsed.error.issues[0].message },
    };
  }

  // The Owner comes from the session, never from the input (ADR 0002).
  // getOwnerId redirects by throwing, so it must not be wrapped in a try/catch.
  const ownerId = await getOwnerId();
  const { id, title, body, version } = parsed.data;

  const [note] = await db
    .update(notes)
    .set({
      title,
      body,
      version: sql`${notes.version} + 1`,
      updatedAt: sql`now()`,
    })
    .where(
      and(
        eq(notes.id, id),
        eq(notes.ownerId, ownerId),
        eq(notes.version, version),
        ne(notes.state, "trashed"),
      ),
    )
    .returning({ id: notes.id, version: notes.version });

  if (!note) {
    return {
      ok: false,
      error: { kind: "not_found", message: "This note could not be saved" },
    };
  }

  revalidatePath("/");
  return { ok: true, data: note };
}
