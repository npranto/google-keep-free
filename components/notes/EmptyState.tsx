import { StickyNote } from "lucide-react";

export function EmptyState({
  message = "Notes you add appear here",
}: {
  message?: string;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-muted-foreground">
      <StickyNote className="size-10" aria-hidden="true" />
      <p className="text-sm">{message}</p>
    </div>
  );
}
