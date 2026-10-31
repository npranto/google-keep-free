"use client";

import { useState } from "react";

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
  serverCopy: AutosaveValues; // what the fake server holds right now
  save: (values: AutosaveValues) => Promise<ActionResult<unknown>>;
};

// A stand-in for the note editor dialog (03.03): two fields, the status, and a
// Flush button, wired to the real useAutosave the way the dialog will wire it.
// Leaving the editor box calls flush(), as closing the dialog will.
export function AutosaveEditor({ initial, serverCopy, save }: Props) {
  const [title, setTitle] = useState(initial.title);
  const [body, setBody] = useState(initial.body);
  const { status, flush } = useAutosave({ values: { title, body }, save });

  const matchesServer = title === serverCopy.title && body === serverCopy.body;

  return (
    <div
      onBlur={(event) => {
        // Moving between the editor's own fields is not leaving it.
        if (!event.currentTarget.contains(event.relatedTarget)) flush();
      }}
      className="space-y-3 rounded-lg border bg-card p-4 shadow-sm"
    >
      <div className="space-y-1">
        <Label htmlFor="demo-title">Title</Label>
        <Input
          id="demo-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="demo-body">Note</Label>
        <Textarea
          id="demo-body"
          rows={4}
          value={body}
          onChange={(event) => setBody(event.target.value)}
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p
          aria-live="polite"
          className={`text-sm font-medium ${status === "error" ? "text-destructive" : ""}`}
        >
          Status: {STATUS_TEXT[status]}
        </p>
        <Button type="button" variant="outline" size="sm" onClick={flush}>
          Flush
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        {matchesServer
          ? "Your text matches Server copy."
          : "Your text differs from Server copy (not saved yet)."}
      </p>
    </div>
  );
}
