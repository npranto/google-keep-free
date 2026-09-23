# UI/UX Specification

Status: approved design contract for MVP implementation. Builds on
[`docs/product/PROJECT_BRIEF.md`](../product/PROJECT_BRIEF.md), [`CONTEXT.md`](../../CONTEXT.md),
the ADRs in [`docs/adr/`](../adr/), and the architecture docs in
[`docs/architecture/`](../architecture/). Companion wireframes:
[`wireframes.md`](./wireframes.md).

This is a lightweight, explicit UI contract for implementation agents to follow
consistently - not a large design system. Implementation should follow this
document rather than inventing visual/interaction behavior ticket-by-ticket.

## 1. Design principles

- **Fast capture over polish.** The composer, grid, and toggle actions
  (pin/archive/trash/color) must feel instant. Optimistic UI (`useOptimistic`/
  `useTransition`, per `system.md`) is the default for all toggle-style
  mutations.
- **Familiar Keep patterns, not reinvention.** Inline click-to-expand composer,
  masonry grid, pinned/unpinned grouping, hover-revealed card actions - all
  deliberately match Google Keep's established interaction model rather than
  introducing novel patterns.
- **Reuse Radix/shadcn primitives directly.** Dialog, Popover, AlertDialog,
  DropdownMenu, and their built-in focus-trap/keyboard/ARIA behavior are used
  as-is. No custom component is built where a primitive already satisfies the
  interaction.
- **No invented complexity.** No custom global keyboard-shortcut layer, no
  JS masonry library, no drag-to-reorder, no per-note undo/merge UI. Every
  "no" here is a deliberate non-goal, not an oversight.
- **Accessible by construction, not by retrofit.** Every icon-only action has
  an `aria-label`; every interactive-on-hover affordance also has a
  keyboard/touch equivalent; focus visibility is never suppressed.

## 2. App shell

Single persistent shell wrapping every view (`app/(app)/layout.tsx`), three
regions:

- **Top bar** (sticky, full width): sidebar toggle (tablet/mobile only) +
  search input + Clerk `<UserButton>`.
- **Sidebar** (left): navigation - see Section 3.
- **Main content**: composer (Active/Label views only) + notes grid, scrolls
  independently of the sidebar.

The shell does not change structurally between views - only sidebar
selection, page heading, and grid contents change, since the whole app is one
route (`/`) disambiguated by `?view=`/`?label=` query params (per
`architecture/system.md`).

## 3. Navigation

**Sidebar content** (top to bottom): Notes (Active, default), Archive, Trash,
a divider, "LABELS" section header, one row per label (alphabetical), "+ Edit
labels" (opens the label management dialog, Section 10). The selected item is
visually highlighted and matches the current `?view=`/`?label=` param.

**Responsive states**:

| Breakpoint | Sidebar state |
|---|---|
| Desktop (`>=1024px`) | Always expanded, fixed width (~256px), no toggle |
| Tablet (`~768-1023px`) | Icon-only rail (~64px) by default; toggle expands it as a temporary overlay on top of content, which auto-collapses back to the rail on selection |
| Mobile (`<768px`) | Hidden by default; toggle opens it as a full-height overlay drawer (scrim-dismissible, closes on Escape) |

Sidebar expand/collapse state is ephemeral - not persisted across sessions;
always starts from the breakpoint's default on load.

## 4. Page/view structure

One route (`/`), four view modes, distinguished by search params:

| View | Param | Composer shown? | Pin grouping? | Card toolbar |
|---|---|---|---|---|
| Notes (Active) | (none) | Yes | Yes | pin, color, labels, archive, trash |
| Archive | `?view=archive` | No | No | color, labels, restore, trash |
| Trash | `?view=trash` | No | No | restore, delete forever only (read-only card) |
| Label | `?label=<id>` | Yes (does not auto-tag) | Yes | pin, color, labels, archive, trash |

Search is not a view/route - it's a client-side debounced overlay that
replaces the grid content in place (Section 9) while leaving the underlying
view/label selection intact underneath.

Page heading reflects the current context: "Notes" is implicit (no heading
needed above the composer), "Archive", "Trash", or the label's name.
Trash additionally shows an "Empty trash" button beside its heading.

## 5. Component hierarchy

```
AppShell
  TopBar
    SidebarToggle (tablet/mobile only)
    SearchInput
    UserButton (Clerk)
  Sidebar
    NavItem (Notes / Archive / Trash)
    LabelList
      LabelNavItem
    EditLabelsTrigger
  MainContent
    Composer (Active/Label views only)
      ColorPickerPopover
      LabelPickerPopover
    EmptyState (conditional)
    NoteGrid
      PinnedSectionDivider (conditional)
      NoteCard (repeated)
        CardToolbar
          ColorPickerPopover
          LabelPickerPopover
    NoteEditorDialog (opens on card click)
      EditorToolbar
        ColorPickerPopover
        LabelPickerPopover
      AutosaveStatus / ConflictBanner
    EditLabelsDialog
    ConfirmDeleteDialog (AlertDialog, reused for delete-forever/empty-trash/delete-label)
    Toaster (global, for error/failure toasts)
```

Shared across views: `NoteGrid`, `NoteCard`, `NoteEditorDialog`,
`ColorPickerPopover`, `LabelPickerPopover`, `EmptyState`, `ConfirmDeleteDialog`.
View-specific: only the page heading and which toolbar actions are shown per
view (Section 4's table) - not separate component trees.

## 6. Note creation behavior

- Collapsed composer: single-line field, placeholder "Take a note...".
- Click/focus expands it **in place** (not a dialog) into: title field, body
  textarea (auto-grows), and a bottom action row (color, labels, archive,
  discard, "Close").
- No explicit "Save" button - autosave begins as soon as there's input
  (Section 16). Closing (blur, Escape, outside click, "Close") flushes the
  save and collapses back to the single-line state.
- An empty composer (no title, no body) on close is discarded silently -
  no row is created.
- Creating a note always creates it as **Active**, regardless of which view
  (Notes or a Label view) the composer was opened from. Labels are never
  auto-assigned based on the current view.

## 7. Note editing behavior

- Clicking an existing note card opens it in a centered `Dialog`
  (desktop/tablet) or a full-screen `Dialog` (mobile, back-arrow instead of
  `x`, Section 12).
- Contains: title field, body textarea, label chips + "add label", and a
  bottom toolbar (pin, color, labels, archive/unarchive, trash) plus the
  autosave status region (Section 16).
- Closing (backdrop click, Escape, close control) **flushes** the pending
  autosave before closing, matching the architecture's blur/close/
  `visibilitychange` flush triggers.
- **Trashed notes** open the same dialog in a **read-only** variant: title/
  body render as static text (no textarea, no cursor), only Restore and
  "Delete forever" appear in the toolbar, no autosave status is shown.

## 8. Note card interactions

- **Contents**: title (truncated), body preview (truncated, plain text),
  label chips (wrapping), background/border reflecting the note's color.
- **Pin icon**: always visible, top-right corner (outlined = unpinned, filled
  = pinned) - not hover-gated, since pin state must be glanceable.
- **Action toolbar** (color, labels, archive, trash, pin depending on view):
  - Pointer/mouse (`hover: hover` media): hidden until `:hover` or
    `:focus-within`.
  - Touch devices (`hover: none` media, covers tablet/mobile regardless of
    viewport width): **always visible** - no tap-to-reveal gesture.
  - Keyboard focus on any toolbar action always reveals the toolbar
    regardless of hover/touch state.
- Clicking the card body (not an icon) opens the full editor (Section 7).
- **Trashed notes** render as read-only cards: no editable click target
  beyond opening the read-only viewer; toolbar limited to Restore and
  Delete forever.

## 9. Search behavior

- Persistent search field in the top bar on desktop/tablet; on mobile it
  collapses to an icon that expands into a full-width field when tapped.
- Debounced 300ms; queries `searchNotes()` (title/body substring match,
  case-insensitive, across Active + Archived, Trashed excluded - per
  `flows.md`).
- While a query is non-empty, the main content area shows a "Results for
  '<query>'" heading and a flat grid (no pinned/others grouping) of matches,
  reusing `NoteCard`/`NoteGrid`. No result count, no matched-text
  highlighting.
- Search always searches globally (Active + Archived) regardless of which
  view/label was selected when typing began - it does not scope to the
  current view.
- Clearing the field reverts to whatever view/label was selected before
  searching.
- Zero results reuses the shared `EmptyState` (Section 14) with
  search-specific copy.

## 10. Label interactions

- **Inline create + assign**: from the note editor's label picker
  (`LabelPickerPopover`) - type a new name to create, or select an existing
  label to assign. New labels appear immediately in the sidebar and the
  picker (per `flows.md`).
- **Label view**: selecting a label in the sidebar filters the grid to that
  label's Active notes only (Section 4).
- **Edit labels dialog** (reached via sidebar "+ Edit labels"): lists every
  label as a row with inline-editable name (click/pencil icon -> text input;
  Enter/blur commits via `renameLabel()`; Escape cancels) and a delete icon
  per row. No create-label input here - creation only happens from the note
  editor. Deleting a label opens a confirmation (Section 22 equivalent -
  Section 15 below) and only detaches it from notes; notes are never deleted.
- Empty state inside the dialog: "You don't have any labels yet - add one
  from a note."

## 11. Archive/trash behavior

**Archive**: same `NoteGrid`/`NoteCard` components as Active, heading
"Archive", no composer, no pinned/others grouping (pinned is always false on
non-Active notes). Card toolbar: color, labels, Restore (replaces Archive),
trash.

**Trash**: heading "Trash" + page-level "Empty trash" button (disabled when
already empty). No composer, no grouping. Cards are read-only - toolbar
limited to Restore and "Delete forever". Both "Delete forever" (per-note) and
"Empty trash" require an `AlertDialog` confirmation (Section 15) since both
are irreversible. Clicking a card opens the read-only editor variant
(Section 7).

## 12. Responsive behavior

| Concern | Desktop (>=1024px) | Tablet (~768-1023px) | Mobile (<768px) |
|---|---|---|---|
| Sidebar | Always expanded | Icon rail, expandable overlay | Hidden, overlay drawer |
| Grid columns | 4 | 2-3 | 1 (single column, per brief) |
| Grid layout | CSS multi-column masonry | Same | Same (1 column = no visual masonry effect) |
| Search field | Persistent, always visible | Persistent, always visible | Icon that expands to full-width field |
| Note editor | Centered `Dialog` | Centered `Dialog` | Full-screen `Dialog`, back-arrow close |
| Card toolbar | Hover/focus-revealed | Always visible (touch) | Always visible (touch) |

Grid layout uses pure CSS (`column-count` + `break-inside: avoid`), not a JS
masonry library - zero extra dependencies, at the cost of column-major (not
strictly row-major) visual fill order.

## 13. Loading states

- **Route-level navigation** (switching views): Next.js `loading.tsx` renders
  a skeleton grid (placeholder cards of varying heights in the masonry
  layout) - avoids layout jump, reads as "content incoming."
- **Search in flight**: existing grid stays visible but dimmed (reduced
  opacity, pointer-events disabled) during the debounced request - no
  skeleton swap for a ~300ms window.
- **Toggle mutations** (pin/archive/trash/color): no loading state beyond the
  existing optimistic UI - instant reflect, rollback only on failure.
- **Initial load/auth**: handled by Clerk's hosted UI and `loading.tsx`; no
  additional custom screen.

## 14. Empty states

One shared `EmptyState` component (muted icon + short message, no custom
illustration artwork), reused with per-view copy:

| View | Copy |
|---|---|
| Notes (no notes) | "Notes you add appear here" (composer still shown above it) |
| Archive | "Your archived notes appear here." |
| Trash | "No notes in Trash." ("Empty trash" disabled) |
| Label (no Active notes) | "No notes with this label yet." |
| Search (no matches) | "No notes match '<query>'" + "Try different words." |

## 15. Error states

- **Expected/recoverable failures** (`ActionResult` validation errors,
  not-found/not-yours): non-blocking toast (shadcn `Sonner`) with a specific,
  actionable message.
- **Failed optimistic toggle** (pin/archive/trash/color rejected by the
  server): UI rolls back to server-confirmed state (per `flows.md`) plus a
  toast: "Couldn't update note - please try again."
- **Unexpected/thrown errors**: route-segment `error.tsx` fallback - icon +
  "Something went wrong" + "Try again" button calling `reset()`. No stack
  trace or technical detail shown to the owner.
- **Version conflict**: handled separately, see Section 16 - not a toast.
- **Destructive confirmations** (delete forever, empty trash, delete label):
  a shared `AlertDialog` (Radix/shadcn `alert-dialog`), applied only to
  irreversible actions:

  | Action | Confirm? |
  |---|---|
  | Active/Archived -> Trash | No (reversible via Restore) |
  | Archive | No (reversible) |
  | Restore | No (reversible, low-stakes) |
  | Delete forever (single note) | **Yes** |
  | Empty trash | **Yes** |
  | Delete label | **Yes** |

  Each confirmation names the specific consequence (not generic copy); the
  destructive button uses the `destructive` token; "Cancel" is the
  default-focused button so an accidental Enter never destroys something.
- No dedicated offline-detection UI for MVP (offline-first sync is an
  explicit non-goal) - network failures surface via the same toast/rollback
  path as any other failure.

## 16. Autosave/status feedback

- A plain-text status region in the **editor dialog's toolbar only** (not
  shown in the inline composer): "Saving..." while a save is in flight,
  "Saved" for ~2s after success, then fades to nothing (`idle`). No spinner
  icon.
- This element is `aria-live="polite"` - it is the accessible status live
  region called for in `CONTEXT.md`, not a separate hidden one.
- **Conflict state** (`updateNote` returns a version conflict): the status
  text is replaced by a persistent inline warning banner (`warning` semantic
  token) above the toolbar: "This note changed elsewhere. Reload to see the
  latest version." with a "Reload" button.
  - Non-blocking: the owner can keep typing/reading; nothing is locked.
  - Further autosave attempts are suspended until "Reload" is clicked.
  - "Reload" re-fetches the server version and replaces the editor's
    content, discarding local unsaved edits (no merge UI for MVP).
  - Closing the dialog while conflicted also discards local edits (same as
    Reload) - this is an accepted, explicit MVP limitation, not a silent
    edge case.

## 17. Accessibility behavior

- **Landmarks**: `<nav>` (sidebar), `<main>` (content), banner/top bar,
  `role="search"` around the search input.
- **Icon-only buttons** (pin, color, labels, archive, trash, more, close):
  every one has a visible-to-assistive-tech `aria-label` - never relies on a
  tooltip alone.
- **Color is never the only signal**: pin uses filled-vs-outline shape (not
  just color); color swatches carry `aria-label`s naming the color; conflict/
  error states pair an icon with text.
- **Contrast**: every note color token's text-on-background pairing is
  verified once at WCAG AA (4.5:1 body text, 3:1 large text/icons) during
  token definition (Section 19) - not re-checked at runtime.
- **Form labeling**: every input (title, body, search, label rename) has a
  real associated `<label>` (visually hidden via `sr-only` where a visible
  label would be redundant, e.g. search) - never placeholder-as-label.
- Verified via: accessible Radix primitives, an automated `axe-core` CI pass,
  and one manual keyboard-only pass over the core flow - per `CONTEXT.md`.
  This is targeted, pragmatic verification, not an exhaustive audit.

## 18. Keyboard interactions

Deliberately minimal - standard interaction-model keys only, no invented
global shortcut layer:

- **Escape**: closes the topmost layer - popover -> dialog -> collapses an
  empty inline composer (flushing any in-progress save first if there's
  content).
- **Enter**: title field moves focus to body (does not submit/close
  anything); label rename input commits the rename; body textarea inserts a
  newline (notes are multi-line).
- **Tab/Shift+Tab**: standard focus traversal; focus is trapped inside an
  open `Dialog`/`Popover` until closed (Radix default).
- **Arrow keys**: native Radix roving-tabindex behavior inside the color
  swatch grid and any `DropdownMenu` - not custom-built.
- No global "new note" shortcut, no custom grid arrow-key navigation between
  cards for MVP - the grid is a plain Tab-ordered sequence of focusable
  cards.

## 19. Design tokens

Built on shadcn/ui + Tailwind defaults; no custom scale invented where a
default already exists.

**Typography**:

| Element | Style |
|---|---|
| Page/view heading | `text-lg font-semibold` |
| Note card title | `text-sm font-medium` |
| Note card body | `text-sm` |
| Sidebar nav item | `text-sm font-medium` |
| Section header ("PINNED") | `text-xs font-medium uppercase tracking-wide text-muted-foreground` |

Base font: shadcn/Tailwind default stack, unchanged.

**Spacing**: Tailwind's default scale (4px base unit) as-is - card padding
`p-4`, grid gap `gap-4`. No custom scale.

**Border radius**: one shared `--radius` token (shadcn default, `0.5rem`)
applied uniformly to cards, buttons, dialogs, popovers, inputs.

**Surfaces**: shadcn's `background`/`card`/`popover` tokens as-is. Sidebar
shares the app `background`, distinguished by a `border-r` rather than a
separate fill color.

**Borders/elevation**:

| Element | Rest | Hover/active |
|---|---|---|
| Note card | 1px `border`, no shadow | `shadow-sm` |
| Dialog | - | `shadow-lg` |
| Popover | - | `shadow-md` |

**Semantic colors**: shadcn's default variable set (`primary`, `secondary`,
`muted`, `accent`, `destructive`, `border`, `input`, `ring`, etc.) plus one
addition - a `warning` token (amber family, AA-verified in both light and
dark) for the conflict banner, since shadcn has no default warning color.

**Note color palette** (fixed, ~stored as a Postgres enum per
`data-model.md`) - 10 named colors plus `default`, each with a verified
light-theme and dark-theme shade:

`default` (no color), `coral`, `peach`, `sand`, `sage`, `fog`, `storm`,
`dusk`, `blossom`, `clay`, `chalk`.

**Interaction states**:

| State | Treatment |
|---|---|
| Hover (card) | `shadow-sm` |
| Hover (button/icon) | shadcn default `hover:bg-accent` |
| Focus | shadcn/Radix default visible ring - never suppressed |
| Destructive | `destructive` token on delete-forever text/buttons and confirm actions |
| Disabled | reduced opacity + `cursor-not-allowed` (shadcn default) |

## 20. Shared primitives vs feature-specific components

**Shared primitives** (`components/ui/`, shadcn - used as-is, no
customization beyond theming): `Dialog`, `Popover`, `AlertDialog`,
`DropdownMenu`, `Sonner` (toast), `Button`, `Input`, `Textarea`.

**Shared feature components** (`components/notes/`, reused across every
view): `NoteGrid`, `NoteCard`, `NoteEditorDialog`, `ColorPickerPopover`,
`LabelPickerPopover`, `EmptyState`, `ConfirmDeleteDialog` (a thin wrapper
around `AlertDialog` with per-action copy).

**Feature-specific, not reused**: `Composer` (Active/Label views only, not
Archive/Trash), `EditLabelsDialog` (`components/labels/`), `SearchInput`
(top bar only), sidebar `NavItem`/`LabelList` (`components/labels/` +
shell).

No component is built as "reusable" speculatively - every shared component
above is shared because at least two views/contexts genuinely use it
identically today, per `CONTEXT.md`'s and `system.md`'s existing feature-
folder structure.

---

## What I need to understand before implementation

A small number of concepts worth being personally clear on before
implementation starts, since they involve accepted tradeoffs rather than
default-obvious behavior:

1. **Conflict resolution has no merge UI.** If the same note is edited in two
   places (two tabs, two devices) and a version conflict occurs, the owner's
   unsaved local edits are discarded either by clicking "Reload" or by
   closing the dialog while conflicted - there is no attempt to merge or
   preserve both versions. This is an accepted MVP limitation, not a bug.
2. **The masonry grid fills column-major, not row-major.** Because it uses
   pure CSS columns (not a JS library), cards flow top-to-bottom within a
   column before wrapping to the next column. Visually this is very close to
   Keep but not pixel-identical in ordering - a deliberate tradeoff for zero
   extra dependencies.
3. **Hover-revealed card actions are pointer-only by design.** Touch devices
   always show the action toolbar (no hidden gesture); keyboard focus also
   always reveals it. If a future design pass wants to hide actions on touch
   too, that needs a new decision - it isn't a bug in the current spec.
4. **Trashed notes are read-only everywhere**, including inside the note
   editor dialog - there is no path to edit title/body/labels/color on a
   trashed note without first restoring it.
5. **Destructive confirmations are intentionally narrow** - only permanent
   deletion (single note or empty trash) and label deletion prompt a
   confirmation. Moving to trash, archiving, and restoring are all
   one-click, no-confirmation actions, matching Keep's own low-friction
   trash model.
