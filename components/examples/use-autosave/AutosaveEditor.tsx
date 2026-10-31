"use client";

import { useEffect, useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  useAutosave,
  type AutosaveStatus,
  type AutosaveValues,
} from "@/components/notes/use-autosave";
import type { ActionResult } from "@/lib/shared/result";

const STATUS_TEXT: Record<AutosaveStatus, string> = {
  idle: "Idle",
  saving: "Saving...",
  saved: "Saved",
  error: "Could not save",
};

type Props = {
  initial: AutosaveValues; // the text the editor opens with
  save: (values: AutosaveValues) => Promise<ActionResult<unknown>>;
  showFlush: boolean;
  // What the card needs to hear about, to tick its steps.
  onEdit: (values: AutosaveValues) => void;
  onStatus: (status: AutosaveStatus) => void;
  onFlush: () => void; // the Flush button was clicked
  onLeave: () => void; // focus left the editor
};

// A stand-in for the note editor dialog (03.03): two fields and the status,
// wired to the real useAutosave the way the dialog will wire it. Leaving the
// editor calls flush(), as closing the dialog will.
export function AutosaveEditor({
  initial,
  save,
  showFlush,
  onEdit,
  onStatus,
  onFlush,
  onLeave,
}: Props) {
  const id = useId();
  const [title, setTitle] = useState(initial.title);
  const [body, setBody] = useState(initial.body);
  const { status, flush } = useAutosave({ values: { title, body }, save });

  useEffect(() => {
    onStatus(status);
  }, [status, onStatus]);

  return (
    <div
      onBlur={(event) => {
        // Moving between the editor's own fields is not leaving it.
        if (event.currentTarget.contains(event.relatedTarget)) return;
        onLeave();
        flush();
      }}
      className="space-y-3 rounded-lg border bg-background p-3"
    >
      <div className="space-y-1">
        <Label htmlFor={`${id}-title`}>Title</Label>
        <Input
          id={`${id}-title`}
          value={title}
          onChange={(event) => {
            setTitle(event.target.value);
            onEdit({ title: event.target.value, body });
          }}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor={`${id}-body`}>Note</Label>
        <Textarea
          id={`${id}-body`}
          rows={3}
          value={body}
          onChange={(event) => {
            setBody(event.target.value);
            onEdit({ title, body: event.target.value });
          }}
        />
      </div>
      <div className="flex items-center justify-between gap-2">
        <p
          aria-live="polite"
          className={`text-sm font-medium ${status === "error" ? "text-destructive" : ""}`}
        >
          Status: {STATUS_TEXT[status]}
        </p>
        {showFlush && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              onFlush();
              flush();
            }}
          >
            Flush
          </Button>
        )}
      </div>
    </div>
  );
}
