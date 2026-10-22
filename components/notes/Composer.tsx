"use client";

import {
  useEffect,
  useRef,
  useState,
  useTransition,
  type FocusEvent,
  type KeyboardEvent,
} from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createNote } from "@/lib/notes/actions";
import { BODY_MAX, TITLE_MAX } from "@/lib/notes/validation";

const SAVE_FAILED = "Could not save the note. Try again.";

// Collapsed it is one line; clicking it, or pressing Enter on it, expands it in
// place (ui-spec section 6). Bare focus does not, so tabbing past it is safe.
// Every way of closing goes through close(), which saves a Note that has content
// and drops one that does not. A failed save keeps the text and says why, so a
// Note is never lost silently.
export function Composer() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [saving, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const container = useRef<HTMLDivElement>(null);
  const collapsed = useRef<HTMLInputElement>(null);
  const bodyField = useRef<HTMLTextAreaElement>(null);
  // State updates land after the next render, so Escape followed by the blur it
  // causes would both see saving as false. A ref closes that gap.
  const inFlight = useRef(false);
  // Set when a close came from the keyboard or the Close button, where focus
  // was inside the composer and would otherwise fall to the page body.
  const focusAfterClose = useRef(false);

  useEffect(() => {
    if (!open && focusAfterClose.current) {
      focusAfterClose.current = false;
      collapsed.current?.focus();
    }
  }, [open]);

  function reset() {
    setOpen(false);
    setTitle("");
    setBody("");
    setError(null);
  }

  // A blur close never takes focus back: focus already went somewhere on purpose.
  function close(restoreFocus: boolean) {
    if (inFlight.current) return;
    focusAfterClose.current = restoreFocus;
    // Whitespace alone is empty, the same rule createNoteSchema applies.
    if (title.trim() === "" && body.trim() === "") {
      reset();
      return;
    }

    inFlight.current = true;
    setError(null);
    // The follow-up updates are transitions too: a state update after an await
    // is not part of the outer one, and reset() should land with the refreshed
    // grid, not before it.
    startTransition(async () => {
      try {
        const result = await createNote({ title, body });
        startTransition(() => {
          if (result.ok) reset();
          else setError(result.error.message);
        });
      } catch {
        startTransition(() => setError(SAVE_FAILED));
      } finally {
        inFlight.current = false;
      }
    });
  }

  // Focus moving between the composer's own fields is not a close.
  function handleBlur(event: FocusEvent<HTMLDivElement>) {
    if (container.current?.contains(event.relatedTarget)) return;
    // The whole window lost focus (tab switch, alt-tab): still mid-note.
    if (!document.hasFocus()) return;
    close(false);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    // Escape also cancels an IME composition: that is not a close.
    if (event.key === "Escape" && !event.nativeEvent.isComposing) close(true);
  }

  // Enter in the title carries on into the note and saves nothing (ui-spec
  // section 18). preventDefault keeps the Enter from also typing a newline into
  // the field that just took focus. Enter also confirms an IME candidate: that
  // is not a move. Safari ends the composition before this keydown, so
  // isComposing is already false there; keyCode 229 still marks it.
  function handleTitleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") return;
    if (event.nativeEvent.isComposing || event.keyCode === 229) return;
    event.preventDefault();
    bodyField.current?.focus();
  }

  if (!open) {
    return (
      <div className="mx-auto w-full max-w-xl px-4 pt-6">
        <Input
          ref={collapsed}
          readOnly
          aria-label="Take a note"
          placeholder="Take a note..."
          className="h-12 cursor-text bg-card px-4 shadow-sm"
          onClick={() => setOpen(true)}
          onKeyDown={(event) => event.key === "Enter" && setOpen(true)}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-xl px-4 pt-6">
      {/* tabIndex makes a click on the padding land on the container, so it is
          not mistaken for focus leaving the composer. */}
      <div
        ref={container}
        tabIndex={-1}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="rounded-lg border bg-card text-card-foreground shadow-md outline-none focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50"
      >
        {/* The container carries the border, so the fields drop their own. */}
        <Label htmlFor="composer-title" className="sr-only">
          Title
        </Label>
        <Input
          id="composer-title"
          autoFocus
          placeholder="Title"
          maxLength={TITLE_MAX}
          value={title}
          readOnly={saving}
          onChange={(event) => setTitle(event.target.value)}
          onKeyDown={handleTitleKeyDown}
          className="h-auto border-0 px-4 pt-3 pb-1 font-medium shadow-none focus-visible:ring-0"
        />
        <Label htmlFor="composer-body" className="sr-only">
          Note
        </Label>
        <Textarea
          ref={bodyField}
          id="composer-body"
          placeholder="Take a note..."
          maxLength={BODY_MAX}
          value={body}
          readOnly={saving}
          onChange={(event) => setBody(event.target.value)}
          className="max-h-96 min-h-20 resize-none border-0 px-4 shadow-none focus-visible:ring-0"
        />
        <div className="flex items-center justify-between gap-2 px-2 pb-2">
          <p role="alert" className="px-2 text-sm text-destructive">
            {error}
          </p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => close(true)}
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
