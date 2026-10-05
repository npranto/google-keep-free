import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import { env } from "../env.ts";

// Neon's HTTP driver: one request per query, no persistent connection. The
// right choice for Vercel serverless functions (see ADR 0001) — do not swap
// this for the websocket/Pool driver.
const sql = neon(env.DATABASE_URL);

export const db = drizzle(sql);