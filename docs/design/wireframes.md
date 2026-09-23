# Wireframes

Status: approved for MVP implementation. Companion to [`ui-spec.md`](./ui-spec.md);
see that document for the reasoning behind each layout. These are structural
sketches, not pixel-perfect visual designs - exact spacing/sizing lives in
`ui-spec.md`'s Design Tokens section.

## Desktop notes view (Active)

```
┌─────────────────────────────────────────────────────────────────┐
│ ☰  Keep Clone        [ 🔍  Search your notes            ]   👤  │
├───────────────┬─────────────────────────────────────────────────┤
│               │  ┌───────────────────────────────────────────┐  │
│  Notes    ●   │  │  Take a note...                            │  │
│  Archive      │  └───────────────────────────────────────────┘  │
│  Trash        │                                                 │
│  ─────────    │   PINNED                                        │
│  LABELS       │  ┌──────────┐ ┌──────────┐ ┌──────────┐         │
│    groceries  │  │ Note A   │ │ Note B   │ │ Note C   │         │
│    work       │  │ ...      │ │ ...      │ │ ...      │         │
│    ideas      │  │ 📌       │ │ 📌       │ │ 📌       │         │
│  + Edit       │  └──────────┘ └──────────┘ └──────────┘         │
│    labels     │  ───────────────────────────────────────────    │
│               │  ┌──────────┐ ┌──────────┐ ┌──────────┐         │
│               │  │ Note D   │ │ Note E   │ │ Note F   │         │
│               │  │ ...      │ │ ...      │ │ ...      │         │
│               │  └──────────┘ └──────────┘ └──────────┘         │
└───────────────┴─────────────────────────────────────────────────┘
```

Sidebar always expanded. Composer collapsed by default. "PINNED" header only
shown when at least one note is pinned; a plain divider (no "OTHERS" text)
separates pinned from the rest. Card toolbars (color/labels/archive/trash)
are hover/focus-revealed, not shown here at rest.

## Mobile notes view (Active)

```
┌─────────────────────────┐
│ ☰   🔍           👤     │
├─────────────────────────┤
│ ┌─────────────────────┐ │
│ │  Take a note...      │ │
│ └─────────────────────┘ │
│                          │
│  PINNED                  │
│ ┌─────────────────────┐ │
│ │ Note A          📌   │ │
│ │ ...                  │ │
│ │ 🎨 🏷️ 📥 🗑️        │ │  ← toolbar always visible (touch)
│ └─────────────────────┘ │
│  ───────────────────────│
│ ┌─────────────────────┐ │
│ │ Note B               │ │
│ │ ...                  │ │
│ │ 🎨 🏷️ 📥 🗑️        │ │
│ └─────────────────────┘ │
└─────────────────────────┘
```

Single column (per brief). Sidebar hidden, reachable via ☰ as a full overlay
drawer. Search icon expands to a full-width field when tapped. Card toolbars
are always visible (no hover on touch).

## Expanded note editor

**Desktop/tablet (centered dialog):**

```
        ┌───────────────────────────────────────────────┐
        │  Title                                    ×    │
        │                                                 │
        │  Note body text goes here, can grow and         │
        │  scroll if it's long...                         │
        │                                                 │
        │  [groceries]  [work]  + add label               │
        │  ─────────────────────────────────────────────  │
        │  📌 🎨 🏷️ 📥 🗑️              Saved ✓          │
        └───────────────────────────────────────────────┘
                          ↑ backdrop dims the rest of the app
```

**With a version conflict:**

```
        ┌───────────────────────────────────────────────┐
        │  Title                                    ×    │
        │  ...body...                                     │
        │  ⚠️  This note changed elsewhere.               │
        │      [ Reload ]                                 │
        │  ─────────────────────────────────────────────  │
        │  📌 🎨 🏷️ 📥 🗑️                                │
        └───────────────────────────────────────────────┘
```

**Read-only (Trashed note):**

```
        ┌───────────────────────────────────────────────┐
        │  Title                                    ×    │
        │  Note body rendered as static text, no          │
        │  cursor, not editable.                          │
        │  [groceries]                                     │
        │  ─────────────────────────────────────────────  │
        │  ↩️ Restore          🗑️ Delete forever          │
        └───────────────────────────────────────────────┘
```

**Mobile (full-screen):**

```
┌─────────────────────────────┐
│ ←  Title                    │
│                              │
│  Note body fills the        │
│  whole screen...             │
│                              │
│  [groceries] + add label     │
│ ──────────────────────────── │
│ 📌 🎨 🏷️ 📥 🗑️   Saved ✓  │
└─────────────────────────────┘
```

## Archive view

```
┌───────────────┬─────────────────────────────────────┐
│ Notes         │  Archive                             │
│ Archive  ●    │                                       │
│ Trash         │  ┌──────────┐  ┌──────────┐          │
│ ───────────   │  │ Note D   │  │ Note E   │          │
│ LABELS        │  │          │  │          │          │
│   groceries   │  │ 🎨 🏷️ ↩️ 🗑️ │  │ 🎨 🏷️ ↩️ 🗑️ │          │
│   work        │  └──────────┘  └──────────┘          │
│ + Edit        │  ┌──────────┐                        │
│   labels      │  │ Note F   │                        │
│               │  └──────────┘                        │
└───────────────┴─────────────────────────────────────┘
```

No composer, no pinned/others grouping. Toolbar: color, labels, restore (↩️,
replaces archive), trash.

## Trash view

```
┌───────────────┬─────────────────────────────────────┐
│ Notes         │  Trash              [ Empty trash ]  │
│ Archive       │                                       │
│ Trash    ●    │  ┌──────────┐  ┌──────────┐          │
│ ───────────   │  │ Note D   │  │ Note E   │          │
│ LABELS        │  │ (read-   │  │ (read-   │          │
│   groceries   │  │  only)   │  │  only)   │          │
│   work        │  │ ↩️   🗑️ │  │ ↩️   🗑️ │          │
│ + Edit        │  └──────────┘  └──────────┘          │
│   labels      │                                       │
└───────────────┴─────────────────────────────────────┘
```

Cards are read-only previews; clicking opens the read-only editor dialog.
🗑️ per-card = "Delete forever" (confirmation required). "Empty trash"
requires a separate confirmation covering every trashed note at once, and is
disabled when Trash is already empty.

## Label view

```
┌───────────────┬─────────────────────────────────────┐
│ Notes         │  groceries                           │
│ Archive       │                                       │
│ Trash         │  ┌─────────────────────────────────┐ │
│ ───────────   │  │  Take a note...                 │ │
│ LABELS        │  └─────────────────────────────────┘ │
│   groceries ● │                                       │
│   work        │   PINNED                              │
│ + Edit        │  ┌──────────┐                        │
│   labels      │  │ Milk...  │                        │
│               │  └──────────┘                        │
│               │  ─────────────────────────────────── │
│               │  ┌──────────┐  ┌──────────┐          │
│               │  │ Eggs...  │  │ Bread... │          │
│               │  └──────────┘  └──────────┘          │
└───────────────┴─────────────────────────────────────┘
```

Heading = label name; sidebar highlights the selected label. Same composer,
grouping, and toolbar behavior as the Active view - a label view is a
filtered Active view, not a distinct mode. New notes created here are not
auto-tagged with the label.

## Search results

```
┌───────────────┬─────────────────────────────────────┐
│ Notes         │  Results for "milk"                  │
│ Archive       │                                       │
│ Trash         │  ┌──────────┐  ┌──────────┐          │
│ ───────────   │  │ Milk...  │  │ Note w/  │          │
│ LABELS        │  │          │  │ milk...  │          │
│   groceries   │  └──────────┘  └──────────┘          │
│   work        │                                       │
│ + Edit        │  (flat grid, no pinned grouping,      │
│   labels      │   no result count, no highlighting)   │
└───────────────┴─────────────────────────────────────┘
```

Search field (top bar) shows the active query with a clear ("×") affordance;
clearing it reverts to whatever view/label was selected before searching.
Results span Active + Archived notes regardless of the prior view (Trashed
excluded).

## Empty state

```
┌─────────────────────┐
│                     │
│        🗒️          │
│                     │
│  Notes you add      │
│  appear here        │
│                     │
└─────────────────────┘
```

One shared component, reused with per-view copy (see `ui-spec.md` Section 14):
Notes ("Notes you add appear here"), Archive ("Your archived notes appear
here."), Trash ("No notes in Trash."), Label ("No notes with this label
yet."), Search ("No notes match '<query>'" + "Try different words.").
