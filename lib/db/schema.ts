import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

// Column shapes follow docs/architecture/data-model.md. The enum value lists
// are exported so validation can reuse them. Postgres cannot remove an enum
// value once Notes might use it, so a token is only ever added or renamed.
export const noteStates = ["active", "archived", "trashed"] as const;
export const noteState = pgEnum("note_state", noteStates);

export const noteColors = [
  "default",
  "coral",
  "peach",
  "sand",
  "sage",
  "fog",
  "storm",
  "dusk",
  "blossom",
  "clay",
  "chalk",
] as const;
export const noteColor = pgEnum("note_color", noteColors);

export const notes = pgTable(
  "notes",
  {
    id: uuid().primaryKey().defaultRandom(),
    // Clerk user id. Opaque: there is no users table to reference.
    ownerId: text("owner_id").notNull(),
    title: varchar({ length: 300 }).notNull().default(""),
    body: varchar({ length: 20000 }).notNull().default(""),
    state: noteState().notNull().default("active"),
    color: noteColor().notNull().default("default"),
    pinned: boolean().notNull().default(false),
    // Optimistic concurrency: incremented on every successful updateNote.
    version: integer().notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    trashedAt: timestamp("trashed_at", { withTimezone: true }),
  },
  (table) => [
    index("notes_owner_id_state_idx").on(table.ownerId, table.state),
    index("notes_owner_id_updated_at_idx").on(table.ownerId, table.updatedAt),
  ],
);
