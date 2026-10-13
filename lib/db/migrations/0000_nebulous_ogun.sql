CREATE TYPE "public"."note_color" AS ENUM('default', 'coral', 'peach', 'sand', 'sage', 'fog', 'storm', 'dusk', 'blossom', 'clay', 'chalk');--> statement-breakpoint
CREATE TYPE "public"."note_state" AS ENUM('active', 'archived', 'trashed');--> statement-breakpoint
CREATE TABLE "notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" text NOT NULL,
	"title" varchar(300) DEFAULT '' NOT NULL,
	"body" varchar(20000) DEFAULT '' NOT NULL,
	"state" "note_state" DEFAULT 'active' NOT NULL,
	"color" "note_color" DEFAULT 'default' NOT NULL,
	"pinned" boolean DEFAULT false NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"trashed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX "notes_owner_id_state_idx" ON "notes" USING btree ("owner_id","state");--> statement-breakpoint
CREATE INDEX "notes_owner_id_updated_at_idx" ON "notes" USING btree ("owner_id","updated_at");