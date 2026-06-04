#!/usr/bin/env bash
# Boot a throwaway PostgreSQL cluster, apply the Supabase-compat layer + all
# migrations + seed from zero, then run the RLS vitest suite against it.
# Self-contained: uses the local PostgreSQL 16 binaries, no Docker/Supabase needed.
set -euo pipefail

PG_BIN="${PG_BIN:-/usr/lib/postgresql/16/bin}"
DB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PORT="${PGPORT:-54329}"
DBNAME="charterbank_test"

# Place the cluster under /tmp (world-traversable, 1777) so the postgres OS user
# can reach it even when the default TMPDIR is a restricted sandbox directory.
TMP="$(mktemp -d -p /tmp charterbank-pg.XXXXXX)"
DATA="$TMP/data"
mkdir -p "$DATA"

# postgres refuses to run as root; drop to the `postgres` user when needed.
RUN=()
if [ "$(id -u)" = "0" ]; then
  chmod 777 "$TMP"
  chown -R postgres:postgres "$TMP"
  RUN=(runuser -u postgres --)
fi

cleanup() {
  "${RUN[@]}" "$PG_BIN/pg_ctl" -D "$DATA" stop -m immediate >/dev/null 2>&1 || true
  rm -rf "$TMP"
}
trap cleanup EXIT

echo "[test:db] initdb"
"${RUN[@]}" "$PG_BIN/initdb" -D "$DATA" -A trust -U postgres >/dev/null

echo "[test:db] starting postgres on localhost:$PORT"
"${RUN[@]}" "$PG_BIN/pg_ctl" -D "$DATA" -l "$TMP/pg.log" \
  -o "-p $PORT -c listen_addresses=localhost -k $TMP" -w start

"${RUN[@]}" "$PG_BIN/createdb" -h localhost -p "$PORT" -U postgres "$DBNAME"

apply() {
  # Pipe via stdin so the file is read as the current (root) user, avoiding any
  # filesystem-permission issues for the postgres OS user.
  echo "[test:db] apply $(basename "$1")"
  "${RUN[@]}" "$PG_BIN/psql" -v ON_ERROR_STOP=1 -h localhost -p "$PORT" -U postgres -d "$DBNAME" -q < "$1"
}

apply "$DB_DIR/supabase/tests/00_supabase_compat.sql"
for f in "$DB_DIR"/supabase/migrations/*.sql; do apply "$f"; done
apply "$DB_DIR/supabase/seed/seed.sql"

echo "[test:db] running RLS suite"
export TEST_DATABASE_URL="postgresql://postgres@localhost:$PORT/$DBNAME"
cd "$DB_DIR"
pnpm exec vitest run
