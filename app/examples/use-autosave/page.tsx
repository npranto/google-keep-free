import type { Metadata } from "next";

import { AutosaveShowcase } from "@/components/examples/use-autosave/AutosaveShowcase";
import { hasExamplesAccess } from "@/lib/examples/access";

export const metadata: Metadata = {
  title: "useAutosave | Examples",
};

// The /examples layout decides what the visitor sees; this check keeps the
// page's own content out of a locked response (see the index page).
export default async function UseAutosaveExamplePage() {
  if (!(await hasExamplesAccess())) return null;

  return <AutosaveShowcase />;
}
