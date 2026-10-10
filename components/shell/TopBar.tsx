import { Input } from "@/components/ui/input";

export function TopBar() {
  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b border-border px-4">
      <span className="text-lg font-medium tracking-tight">Keep</span>
      <Input
        type="search"
        placeholder="Search"
        aria-label="Search notes"
        className="max-w-md"
      />
    </header>
  );
}
