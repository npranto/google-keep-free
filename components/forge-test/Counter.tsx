"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

import { Section } from "./Section";

// Client component with state and no fetching: its first HTML shows 0, and the
// buttons start working once the page has hydrated.
export function Counter() {
  const [count, setCount] = useState(0);

  return (
    <Section id="counter" rendering="client" title="Counter">
      <div className="flex items-center gap-4">
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Decrease"
          onClick={() => setCount((value) => value - 1)}
        >
          -
        </Button>
        <output
          aria-label="Count"
          data-slot="count"
          className="min-w-8 text-center text-2xl font-semibold tabular-nums"
        >
          {count}
        </output>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Increase"
          onClick={() => setCount((value) => value + 1)}
        >
          +
        </Button>
      </div>
    </Section>
  );
}
