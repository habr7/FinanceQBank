import { join } from "node:path";

import { JsonContentStore } from "./json-store";
import { PgContentStore } from "./pg-store";
import type { ContentStore } from "./types";

export * from "./types";
export { JsonContentStore } from "./json-store";
export { PgContentStore } from "./pg-store";

/**
 * Default content store. Uses the Postgres-backed store when a database URL is
 * configured (SUPABASE_DB_URL / DATABASE_URL) so generated content lands in the
 * Phase 1 tables the Admin Content Studio reads; otherwise an offline JSON store
 * under `.charterbank-content/` (overridable via CONTENT_STORE_FILE).
 */
export function createContentStore(): ContentStore {
  const dbUrl = process.env.SUPABASE_DB_URL ?? process.env.DATABASE_URL;
  if (dbUrl) return new PgContentStore(dbUrl);
  const file =
    process.env.CONTENT_STORE_FILE ?? join(process.cwd(), ".charterbank-content", "store.json");
  return new JsonContentStore(file);
}
