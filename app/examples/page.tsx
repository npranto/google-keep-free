import Link from "next/link";

import { hasExamplesAccess } from "@/lib/examples/access";

// Add a new example page by creating its folder under app/examples/ and adding
// one entry here. Start the new page with the same access check as below: the
// layout decides what the visitor sees, but a page renders in parallel with it,
// so only its own check keeps its content out of a locked response.
const EXAMPLES = [
  {
    href: "/examples/use-autosave",
    title: "useAutosave hook",
    description:
      "A live note editor wired to the real hook with a fake server you can slow down or make fail, plus test cases with steps and expected results.",
  },
];

export default async function ExamplesIndexPage() {
  if (!(await hasExamplesAccess())) return null;

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <h1 className="text-2xl font-semibold">Examples</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Pages for trying hooks, components and flows by hand, on any deployment.
        Each one lists what to do and what you should see.
      </p>
      <ul className="mt-6 space-y-3">
        {EXAMPLES.map((example) => (
          <li key={example.href}>
            <Link
              href={example.href}
              className="block rounded-lg border bg-card p-4 hover:border-ring"
            >
              <span className="font-medium">{example.title}</span>
              <span className="mt-1 block text-sm text-muted-foreground">
                {example.description}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
