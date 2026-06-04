import { join } from "node:path";

import { JsonContentStore } from "./json-store";
import type { ContentStore } from "./types";

export * from "./types";
export { JsonContentStore } from "./json-store";

/**
 * Default content store. Offline JSON store under `.charterbank-content/` (overridable
 * via CONTENT_STORE_FILE). A Supabase-backed store that writes to the Phase 1 tables
 * is wired up in Phase 5 (Admin Content Studio), which consumes this data.
 */
export function createContentStore(): ContentStore {
  const file =
    process.env.CONTENT_STORE_FILE ?? join(process.cwd(), ".charterbank-content", "store.json");
  return new JsonContentStore(file);
}
