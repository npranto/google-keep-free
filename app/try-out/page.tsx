import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";

// Dummy copy only, so search engines are told not to index the page. Remove
// `robots` when the real landing copy ships, or the page never gets indexed.
export const metadata: Metadata = {
  title: "Try it out | Google Keep Free",
  robots: { index: false },
};

const inner = "mx-auto w-full max-w-5xl px-6 py-16 md:py-24";

const benefits = [
  {
    id: "capture",
    title: "Capture a thought",
    description: "Write a note in seconds, before the idea gets away.",
  },
  {
    id: "organize",
    title: "Keep it organized",
    description: "Sort your notes your way, so the important ones stay close.",
  },
  {
    id: "find",
    title: "Find it again",
    description: "Come back later and pick up right where you left off.",
  },
];

export default function TryOutPage() {
  return (
    <main className="flex flex-1 flex-col">
      <section>
        <div className={`${inner} text-center`}>
          <p className="text-sm font-medium tracking-widest text-muted-foreground uppercase">
            Placeholder page
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-balance md:text-6xl">
            A simpler place for your notes
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-pretty text-muted-foreground">
            Google Keep Free is a small notes app for capturing short thoughts
            and finding them later.
          </p>
          <div className="mt-8 flex justify-center">
            <Button asChild size="lg">
              <Link href="/sign-up">Get started</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="border-t border-border">
        <div className={inner}>
          <h2 className="text-center text-2xl font-semibold tracking-tight md:text-3xl">
            What you get
          </h2>
          <ul className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
            {benefits.map((benefit) => (
              <li
                key={benefit.id}
                className="rounded-2xl border border-border bg-card p-6 shadow-sm"
              >
                <h3 className="text-lg font-semibold tracking-tight">
                  {benefit.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {benefit.description}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="flex-1 border-t border-border bg-muted">
        <div className={`${inner} text-center`}>
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
            More is on the way
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-pretty">
            This page holds placeholder copy for now. The real one is still
            being written.
          </p>
        </div>
      </section>
    </main>
  );
}
