"use server";

import { revalidatePath } from "next/cache";

import { getOwnerId } from "@/lib/auth/current-owner";
import { db } from "@/lib/db";
import { notes } from "@/lib/db/schema";
import type { ActionResult } from "@/lib/shared/result";

import { createNoteSchema } from "./validation";

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
