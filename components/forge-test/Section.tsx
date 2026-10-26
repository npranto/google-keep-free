import type { ReactNode } from "react";

// Every section on /forge-test names how it renders. `rendering` is also the
// hook the tests use to find a section, so the label and the test never drift.
const MODES = {
  server: "Server rendered, at request time",
  "server-cached": "Server rendered, cached for 60 seconds",
  streamed: "Server rendered, streamed with Suspense",
  client: "Client component, no fetching",
  "client-fetch": "Client component, fetches after mount",
  lazy: "Client component, lazy loaded on click",
} as const;

export type Rendering = keyof typeof MODES;

type SectionProps = {
  id: string;
  rendering: Rendering;
  title: string;
  // Set by sections that load data: "unavailable" means the API failed and the
  // section is showing its message instead of data. "loading" is only for the
  // section that fetches in the browser.
  state?: "loading" | "ready" | "unavailable";
  children: ReactNode;
};

export function Section({
  id,
  rendering,
  title,
  state,
  children,
}: SectionProps) {
  return (
    <section
      data-section={id}
      data-rendering={rendering}
      data-state={state}
      aria-labelledby={`${id}-title`}
      className="rounded-2xl border border-border bg-card p-6 shadow-sm"
    >
      <p
        data-slot="rendering-mode"
        className="text-xs font-medium tracking-widest text-muted-foreground uppercase"
      >
        {MODES[rendering]}
      </p>
      <h2
        id={`${id}-title`}
        className="mt-2 text-xl font-semibold tracking-tight"
      >
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

// What a data section shows when the dummy API fails: the rest of the page
// still renders.
export function Unavailable() {
  return (
    <p className="text-sm text-muted-foreground">
      This section is unavailable right now. The dummy API did not answer.
    </p>
  );
}

// A data section whose API call failed: its frame, with the message in place of
// the data.
export function UnavailableSection(
  props: Pick<SectionProps, "id" | "rendering" | "title">,
) {
  return (
    <Section {...props} state="unavailable">
      <Unavailable />
    </Section>
  );
}
