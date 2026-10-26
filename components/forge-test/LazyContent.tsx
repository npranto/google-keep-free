// The part that is loaded on demand. It is a separate module on purpose:
// next/dynamic gives it its own JavaScript chunk, fetched only after the click.
const MODES = [
  ["Server", "HTML built per request, data in the first response"],
  ["Cached", "HTML built from a cached fetch, refreshed on a timer"],
  ["Streamed", "Shell first, slow parts follow in the same response"],
  ["Client", "Runs in the browser after hydration"],
  ["Lazy", "Its code downloads only when it is needed"],
];

// Takes focus when it appears: the button that loaded it is gone by then, and
// focus would otherwise fall back to the top of the page.
export default function LazyContent() {
  return (
    <dl
      ref={(element) => element?.focus()}
      tabIndex={-1}
      aria-label="Rendering cheat sheet"
      data-slot="lazy-content"
      className="divide-y divide-border text-sm outline-none"
    >
      {MODES.map(([term, description]) => (
        <div key={term} className="py-2">
          <dt className="font-medium">{term}</dt>
          <dd className="text-muted-foreground">{description}</dd>
        </div>
      ))}
    </dl>
  );
}
