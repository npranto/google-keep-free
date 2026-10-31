import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import type { ReactNode } from "react";

import { UnlockForm } from "@/components/examples/UnlockForm";
import { examplesAreEnabled, hasExamplesAccess } from "@/lib/examples/access";

// Internal pages: keep search engines away.
export const metadata: Metadata = {
  title: "Examples | Google Keep Free",
  robots: { index: false, follow: false },
};

// The gate for every page under /examples, and their shared frame.
//   - No EXAMPLES_ACCESS_KEY configured: the whole area answers 404.
//   - No valid cookie: only the key form is shown, never the page.
// A page renders in parallel with this layout, so each page also starts with
// hasExamplesAccess(); that keeps its content out of a locked response. This is
// surface-level protection: pages in here hold only demo text and fake data,
// never anything real.
export default async function ExamplesLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Always decide per request. Without this, a build with no key configured
  // would bake the 404 into static HTML, and the gate would depend on whatever
  // the build environment happened to hold.
  await connection();

  if (!examplesAreEnabled()) notFound();
  if (!(await hasExamplesAccess())) return <UnlockForm />;

  return (
    <>
      <header className="border-b bg-card">
        <div className="mx-auto flex w-full max-w-6xl items-baseline gap-3 px-4 py-3">
          <Link href="/examples" className="font-semibold hover:underline">
            Internal examples
          </Link>
          <span className="text-sm text-muted-foreground">
            For visual testing. Not for users.
          </span>
        </div>
      </header>
      {children}
    </>
  );
}
