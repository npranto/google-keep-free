import type { Metadata } from "next";
import { Suspense } from "react";

import { ClientFetch } from "@/components/forge-test/ClientFetch";
import { Counter } from "@/components/forge-test/Counter";
import { LazyPanel } from "@/components/forge-test/LazyPanel";
import {
  StreamedSection,
  StreamedSkeleton,
} from "@/components/forge-test/StreamedSection";
import {
  PostsSection,
  QuoteSection,
  TodosSection,
  UsersSection,
} from "@/components/forge-test/ServerSections";

// A demo with dummy data, so search engines are told not to index it.
export const metadata: Metadata = {
  title: "Rendering demo | Google Keep Free",
  robots: { index: false },
};

// Most of this page is server rendered: the data is fetched in the server
// components below and is part of the first HTML. Each section says how it
// renders. Nothing links here.
export default function ForgeTestPage() {
  return (
    <main className="flex flex-1 flex-col">
      <div className="mx-auto w-full max-w-5xl px-6 py-12 md:py-16">
        <p className="text-sm font-medium tracking-widest text-muted-foreground uppercase">
          Demo page
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-balance md:text-5xl">
          How this page renders
        </h1>
        <p className="mt-4 max-w-2xl text-pretty text-muted-foreground">
          Dummy content from a public test API. Each card names the way it is
          rendered.
        </p>
        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
          <PostsSection />
          <UsersSection />
          <TodosSection />
          <QuoteSection />
          <Suspense fallback={<StreamedSkeleton />}>
            <StreamedSection />
          </Suspense>
          <Counter />
          <ClientFetch />
          <LazyPanel />
        </div>
      </div>
    </main>
  );
}
