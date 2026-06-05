/**
 * @charterbank/db
 *
 * Phase 1: Supabase migrations, seed, RLS policies, RLS tests, and DB types.
 * Migrations live in supabase/migrations; the RLS suite runs via
 * `pnpm --filter @charterbank/db test:db` against a throwaway Postgres cluster.
 *
 * This entrypoint exports types only (no runtime/Node-only imports such as `pg`),
 * so it is safe to consume from the Next.js app via transpilePackages.
 */

export * from "./types";

export const DB_PACKAGE_READY = true;
