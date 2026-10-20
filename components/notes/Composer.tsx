"use client";

import {
  startTransition,
  useEffect,
  useRef,
  useState,
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
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const container = useRef<HTMLDivElement>(null);
  const collapsed = useRef<HTMLInputElement>(null);
  // Set synchronously so blur and the click that caused it cannot both save.
  // Cleared only after the render that closes the composer or shows the error
  // has committed. Clearing it when the request promise settles is too early:
  // Escape repeats, and that continuation runs before React paints the reset,
  // so a second close inserts another copy of the same Note.
  const inFlight = useRef(false);
  // Set when a close came from the keyboard or the Close button, where focus
  // was inside the composer and would otherwise fall to the page body.
  const focusAfterClose = useRef(false);

  useEffect(() => {
    if (!pending) inFlight.current = false;
  }, [pending]);

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
    setPending(true);
    setError(null);
    // The follow-up updates are transitions too: a state update after an await
    // is not part of the outer one, and reset() should land with the refreshed
    // grid, not before it. pending stays true until that render, and the effect
    // above is what releases the guard.
    startTransition(async () => {
      try {
        const result = await createNote({ title, body });
        startTransition(() => {
          setPending(false);
          if (result.ok) reset();
          else setError(result.error.message);
        });
      } catch {
        startTransition(() => {
          setPending(false);
          setError(SAVE_FAILED);
        });
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
          readOnly={pending}
          onChange={(event) => setTitle(event.target.value)}
          className="h-auto border-0 px-4 pt-3 pb-1 font-medium shadow-none focus-visible:ring-0"
        />
        <Label htmlFor="composer-body" className="sr-only">
          Note
        </Label>
        <Textarea
          id="composer-body"
          placeholder="Take a note..."
          maxLength={BODY_MAX}
          value={body}
          readOnly={pending}
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
            disabled={pending}
            onClick={() => close(true)}
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
