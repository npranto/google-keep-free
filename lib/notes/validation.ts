import { z } from "zod";

// Limits match the varchar lengths in lib/db/schema.ts. Exported so the UI can
// reuse them.
export const TITLE_MAX = 300;
export const BODY_MAX = 20000;

// Postgres text cannot hold a NUL, so the insert would throw. Reject it here.
const noNul = (text: string) => !text.includes("\u0000");
const NUL_MESSAGE = "Text cannot contain a NUL character";

// A Note needs content in the title or the body. Whitespace alone is empty,
// but the text is kept as typed: autosave sends what the editor shows.
// z.object drops unknown keys, so a client-supplied ownerId never gets through.
export const createNoteSchema = z
  .object({
    title: z.string().max(TITLE_MAX).refine(noNul, NUL_MESSAGE).default(""),
    body: z.string().max(BODY_MAX).refine(noNul, NUL_MESSAGE).default(""),
  })
  .refine((note) => note.title.trim() !== "" || note.body.trim() !== "", {
    message: "A note needs a title or a body",
    path: ["body"],
  });

export type CreateNoteInput = z.infer<typeof createNoteSchema>;
