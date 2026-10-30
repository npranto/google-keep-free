import { z } from "zod";

// Limits match the varchar lengths in lib/db/schema.ts. Exported so the UI can
// reuse them.
export const TITLE_MAX = 300;
export const BODY_MAX = 20000;

// Postgres text cannot hold a NUL, so the insert would throw. Reject it here.
const noNul = (text: string) => !text.includes("\u0000");
const NUL_MESSAGE = "Text cannot contain a NUL character";

const titleText = z.string().max(TITLE_MAX).refine(noNul, NUL_MESSAGE);
const bodyText = z.string().max(BODY_MAX).refine(noNul, NUL_MESSAGE);

// A Note needs content in the title or the body, on create and on every later
// save. Whitespace alone is empty, but the text is kept as typed: autosave
// sends what the editor shows.
const hasContent = (note: { title: string; body: string }) =>
  note.title.trim() !== "" || note.body.trim() !== "";
const needsContent = {
  message: "A note needs a title or a body",
  path: ["body"],
};

// z.object drops unknown keys, so a client-supplied ownerId never gets through.
export const createNoteSchema = z
  .object({ title: titleText.default(""), body: bodyText.default("") })
  .refine(hasContent, needsContent);

// Unlike create, title and body are required: a payload that leaves one out
// must fail, not default to "" and blank the Note. The version is the one the
// client last read, so the server can tell whether the Note moved on since.
// It is capped at the 32-bit integer column, so a larger value is rejected
// here instead of making Postgres throw.
export const updateNoteSchema = z
  .object({
    id: z.uuid(),
    title: titleText,
    body: bodyText,
    version: z.int32().positive(),
  })
  .refine(hasContent, needsContent);

export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;
