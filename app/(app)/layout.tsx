import type { ReactNode } from "react";

import { AppShell } from "@/components/shell/AppShell";
import { getOwnerId } from "@/lib/auth/current-owner";

// Auth guard for everything under (app). Layouts do not re-run on client
// navigation, so every Server Action still calls getOwnerId() itself.
export default async function AppLayout({ children }: { children: ReactNode }) {
  await getOwnerId();
  return <AppShell>{children}</AppShell>;
}
