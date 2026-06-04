import "server-only";

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@charterbank/db";

import { getSupabaseEnv } from "@/lib/env";

/**
 * Service-role Supabase client — bypasses RLS. SERVER ONLY (guarded by
 * `server-only`). Used strictly for trusted operations such as reading the
 * answer key (`correct_option`, which is revoked from students) to grade and
 * reveal a result AFTER an answer is submitted. Never expose this to the client.
 */
export function createSupabaseAdminClient() {
  const env = getSupabaseEnv();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!env || !serviceRoleKey) return null;

  return createClient<Database>(env.url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
