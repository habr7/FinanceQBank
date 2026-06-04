-- 0001_extensions.sql
-- Extensions required by the schema. On Supabase these may already be enabled;
-- the IF NOT EXISTS guards keep this idempotent and safe to run from zero.

create extension if not exists pgcrypto; -- gen_random_uuid(), digest()
create extension if not exists citext; -- case-insensitive email

-- NOTE: pgvector (embeddings on source_chunks) is intentionally deferred to a later
-- phase to avoid requiring the `vector` extension in the MVP. See docs/DB_SCHEMA.md.
