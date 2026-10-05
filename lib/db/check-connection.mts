// Run with: node --env-file=.env.local lib/db/check-connection.mts
import { sql } from "drizzle-orm";

import { db } from "./index.ts";

async function main() {
  const result = await db.execute(sql`select 1`);
  console.log("[db] connectivity check succeeded:", result);
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error("[db] connectivity check failed:", error);
    process.exit(1);
  });