import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Notes", selected: true },
  { label: "Archive", selected: false },
  { label: "Trash", selected: false },
] as const;

export function Sidebar() {
  return (
    <nav
      aria-label="Note views"
      className="w-56 shrink-0 border-r border-border p-2"
    >
      <ul className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => (
          <li key={item.label}>
            <button
              type="button"
              aria-current={item.selected ? "page" : undefined}
              className={cn(
                "flex w-full items-center rounded-full px-4 py-2 text-left text-sm font-medium outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                item.selected
                  ? "bg-secondary text-secondary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              {item.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
