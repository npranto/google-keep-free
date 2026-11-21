"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { AlertCircleIcon } from "lucide-react";
import { z } from "zod";

import {
  useAutosave,
  type AutosaveStatus,
  type AutosaveValues,
} from "@/components/notes/use-autosave";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { updateNote } from "@/lib/notes/actions";
import { BODY_MAX, TITLE_MAX } from "@/lib/notes/validation";

// What GET /api/notes/[id] answers with (ticket 03.03.01).
const loadedNoteSchema = z.object({
  id: z.string(),
  title: z.string(),
  body: z.string(),
  version: z.int().positive(),
});
type LoadedNote = z.infer<typeof loadedNoteSchema>;

type Load =
  | { state: "loading" }
  | { state: "error" }
  | { state: "ready"; note: LoadedNote };

// Any answer that is not the Note's JSON is a failure. A signed-out call is
// redirected, so fetch follows it and gets the sign-in page as HTML with a 200:
// the content type is what tells the two apart.
async function fetchNote(
  id: string,
  signal: AbortSignal,
): Promise<LoadedNote | null> {
  const response = await fetch(`/api/notes/${id}`, {
    signal,
    cache: "no-store",
  });
  const isJson = response.headers.get("content-type")?.includes("json");
  if (!response.ok || response.redirected || !isJson) return null;

  const parsed = loadedNoteSchema.safeParse(await response.json());
  return parsed.success ? parsed.data : null;
}

const SAVE_FAILED = "Could not save. Your changes are kept here.";
const EMPTY_NOTE = "A note needs a title or a body";

// Opens one Note in a centered dialog and saves every edit as the Owner types,
// with no Save button. `trigger` is the element that opens it, so closing hands
// focus back to it. The dialog's content is mounted only while it is open, so
// each opening reads the Note afresh.
export function NoteEditorDialog({
  noteId,
  trigger,
}: {
  noteId: string;
  trigger: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  // The form that is mounted while the Note is loaded hands its flush here.
  const flushRef = useRef<(() => void) | null>(null);

  // Every way of closing (Escape, the backdrop, the close control) comes
  // through here, so a pending edit is sent before the dialog goes away.
  function handleOpenChange(next: boolean) {
    if (!next) flushRef.current?.();
    setOpen(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="gap-3 p-4 sm:max-w-xl">
        <DialogHeader className="sr-only">
          <DialogTitle>Edit note</DialogTitle>
          <DialogDescription>
            Your changes are saved automatically.
          </DialogDescription>
        </DialogHeader>
        <NoteEditor noteId={noteId} flushRef={flushRef} />
      </DialogContent>
    </Dialog>
  );
}

function NoteEditor({
  noteId,
  flushRef,
}: {
  noteId: string;
  flushRef: RefObject<(() => void) | null>;
}) {
  const [load, setLoad] = useState<Load>({ state: "loading" });

  useEffect(() => {
    const request = new AbortController();
    fetchNote(noteId, request.signal)
      .then((note) => {
        setLoad(note ? { state: "ready", note } : { state: "error" });
      })
      .catch(() => {
        if (!request.signal.aborted) setLoad({ state: "error" });
      });
    return () => request.abort();
  }, [noteId]);

  if (load.state === "loading") {
    return (
      <p role="status" className="py-8 text-sm text-muted-foreground">
        Loading note…
      </p>
    );
  }
  if (load.state === "error") {
    return (
      <p role="alert" className="py-8 text-sm text-destructive">
        Could not open this note. Close this window and try again.
      </p>
    );
  }
  return <NoteForm note={load.note} flushRef={flushRef} />;
}

function NoteForm({
  note,
  flushRef,
}: {
  note: LoadedNote;
  flushRef: RefObject<(() => void) | null>;
}) {
  const id = useId();
  const [title, setTitle] = useState(note.title);
  const [body, setBody] = useState(note.body);
  // The version comes from each save's result, never from the grid: a save
  // revalidates the page, and the grid's props are not this Note's latest.
  const version = useRef(note.version);

  const { status, flush } = useAutosave({
    values: { title, body },
    save: async (values: AutosaveValues) => {
      const result = await updateNote({
        id: note.id,
        ...values,
        version: version.current,
      });
      if (result.ok) version.current = result.data.version;
      return result;
    },
  });

  useEffect(() => {
    flushRef.current = flush;
    return () => {
      flushRef.current = null;
    };
  }, [flush, flushRef]);

  // updateNote can answer a validation error with a raw zod message, so the
  // only failure this dialog words itself is the one it can name: no content.
  const isEmpty = title.trim() === "" && body.trim() === "";

  return (
    <>
      <Label htmlFor={`${id}-title`} className="sr-only">
        Title
      </Label>
      <Input
        id={`${id}-title`}
        autoFocus
        placeholder="Title"
        maxLength={TITLE_MAX}
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        onBlur={() => flush()}
        className="h-auto border-0 px-1 pr-8 text-base font-medium shadow-none focus-visible:ring-0"
      />
      <Label htmlFor={`${id}-body`} className="sr-only">
        Note
      </Label>
      <Textarea
        id={`${id}-body`}
        placeholder="Take a note..."
        maxLength={BODY_MAX}
        value={body}
        onChange={(event) => setBody(event.target.value)}
        onBlur={() => flush()}
        className="max-h-[50vh] min-h-32 resize-none overflow-y-auto border-0 px-1 shadow-none focus-visible:ring-0"
      />
      <EditorToolbar
        status={status}
        errorText={isEmpty ? EMPTY_NOTE : SAVE_FAILED}
      />
    </>
  );
}

// The toolbar is the one place later tickets add to: 05 (pin), 06 (archive),
// 07 (trash), 09 (color) and 10 (labels) put their buttons in the actions slot.
function EditorToolbar({
  status,
  errorText,
}: {
  status: AutosaveStatus;
  errorText: string;
}) {
  return (
    <div className="flex min-h-9 items-center justify-between gap-2">
      <div
        data-slot="editor-toolbar-actions"
        className="flex items-center gap-1"
      />
      <SaveStatus status={status} errorText={errorText} />
    </div>
  );
}

// The region stays mounted while idle, because a live region is only announced
// when its text changes. "Saved" fades over its last moments: the hook returns
// to idle after 2 seconds and the text goes with it.
function SaveStatus({
  status,
  errorText,
}: {
  status: AutosaveStatus;
  errorText: string;
}) {
  return (
    <p
      role="status"
      aria-live="polite"
      className={
        status === "error"
          ? "flex items-center gap-1.5 text-sm text-destructive"
          : status === "saved"
            ? "animate-[saved-fade_2s_ease-out_forwards] text-sm text-muted-foreground motion-reduce:animate-none"
            : "text-sm text-muted-foreground"
      }
    >
      {status === "saving" && "Saving…"}
      {status === "saved" && "Saved"}
      {status === "error" && (
        <>
          <AlertCircleIcon aria-hidden="true" className="size-4 shrink-0" />
          {errorText}
        </>
      )}
    </p>
  );
}
