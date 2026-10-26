"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

import { Button } from "@/components/ui/button";

import { Section } from "./Section";

// ssr: false is only allowed in a Client Component, which is why this wrapper
// exists. The content is not in the first HTML and its code is not in the
// first download.
const LazyContent = dynamic(() => import("./LazyContent"), {
  ssr: false,
  loading: () => (
    <p role="status" className="text-sm text-muted-foreground">
      Loading...
    </p>
  ),
});

export function LazyPanel() {
  const [shown, setShown] = useState(false);

  return (
    <Section id="lazy" rendering="lazy" title="Rendering cheat sheet">
      {shown ? (
        <LazyContent />
      ) : (
        <Button type="button" variant="outline" onClick={() => setShown(true)}>
          Load the cheat sheet
        </Button>
      )}
    </Section>
  );
}
