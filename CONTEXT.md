# Notes

A personal notes app inspired by Google Keep, where an individual owner captures short notes quickly and organizes them for later retrieval.

## Language

**Owner**:
The person who signs in and whose Notes and Labels are private to them. Use
"Owner" for domain ownership; "User" may still refer to Clerk's
authenticated user at authentication/infrastructure boundaries (e.g. Clerk's
`userId`, `currentUser()`).
_Avoid_: Account, customer

**Note**:
A short titled piece of plain text belonging to exactly one Owner, in exactly one State.
_Avoid_: Memo, card, entry, document

**State**:
Which of three mutually exclusive places a Note lives: Active, Archived, or Trashed.
_Avoid_: Status, folder

**Active**:
The State of a Note in the Owner's main working set.
_Avoid_: Open, live

**Archived**:
The State of a Note the Owner no longer wants in the main working set but wants to keep.
_Avoid_: Hidden, stored

**Trashed**:
The State of a Note the Owner wants gone; it is read-only and can be restored until permanently deleted.
_Avoid_: Deleted, removed

**Restore**:
Move an Archived or Trashed Note back to Active, always to Active. A
Trashed Note may also come directly from Archived (trashing an archived
Note does not first restore it); there is no direct Trashed → Archived
transition.
_Avoid_: Undelete, unarchive

**Permanent deletion**:
Irreversibly removing a Trashed Note; only Trashed Notes can be permanently deleted.
_Avoid_: Hard delete, purge

**Label**:
An Owner-defined freeform name that can be attached to many Notes; a Note can carry many Labels, and names are unique per Owner ignoring case.
_Avoid_: Tag, category, folder

**Label view**:
The list of an Owner's Active Notes carrying a given Label.
_Avoid_: Label folder, tag page

**Color**:
One named choice from a fixed palette (including a default of no color) that a Note has exactly one of at a time.
_Avoid_: Theme, background, custom color

**Pinned**:
A flag that keeps an Active Note at the top of the grid; it is only valid on Active Notes and is cleared when a Note is Archived or Trashed.
_Avoid_: Starred, favorite
