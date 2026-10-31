"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { unlockExamples } from "@/app/examples/actions";

// What anyone without the access key sees under /examples.
export function UnlockForm() {
  const [state, formAction, pending] = useActionState(unlockExamples, null);

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-4 px-4 py-16">
      <h1 className="text-xl font-semibold">Internal examples</h1>
      <p className="text-sm text-muted-foreground">
        Enter the access key to continue.
      </p>
      <form action={formAction} className="space-y-3">
        <Label htmlFor="examples-key">Access key</Label>
        <Input
          id="examples-key"
          name="key"
          type="password"
          autoComplete="off"
          autoFocus
          required
        />
        <p role="alert" className="min-h-5 text-sm text-destructive">
          {state?.error}
        </p>
        <Button type="submit" disabled={pending}>
          Unlock
        </Button>
      </form>
    </main>
  );
}
