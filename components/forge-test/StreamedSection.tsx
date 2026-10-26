import { fetchDummy } from "@/lib/forge-test/dummy-api";

import { Section, UnavailableSection } from "./Section";

type Comment = {
  id: number;
  body: string;
  likes: number;
  user: { username: string };
};

// The Suspense fallback: it is part of the page shell, so it arrives with the
// first bytes while StreamedSection is still waiting on the API.
export function StreamedSkeleton() {
  return (
    <Section
      id="streamed"
      rendering="streamed"
      title="Fresh comments"
      state="loading"
    >
      <div aria-hidden="true" className="space-y-3">
        {[0, 1, 2].map((bar) => (
          <div key={bar} className="h-4 animate-pulse rounded bg-muted" />
        ))}
      </div>
      <p role="status" className="sr-only">
        Loading comments...
      </p>
    </Section>
  );
}

// Server rendered like the others, but slow on purpose: the API is asked to wait
// 2 seconds (`delay`). Behind a Suspense boundary, the rest of the page is sent
// first and this section follows in the same response.
export async function StreamedSection() {
  const result = await fetchDummy<{ comments: Comment[] }>(
    "/comments?limit=4&delay=2000&select=body,likes,user",
    { cache: "no-store" },
  );
  if (!result.ok) {
    return (
      <UnavailableSection
        id="streamed"
        rendering="streamed"
        title="Fresh comments"
      />
    );
  }
  return (
    <Section
      id="streamed"
      rendering="streamed"
      title="Fresh comments"
      state="ready"
    >
      <ul className="divide-y divide-border">
        {result.data.comments.map((comment) => (
          <li key={comment.id} className="py-2 text-sm">
            {comment.body}
            <span className="ml-2 text-muted-foreground">
              @{comment.user.username}
            </span>
          </li>
        ))}
      </ul>
    </Section>
  );
}
