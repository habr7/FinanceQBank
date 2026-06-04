import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@charterbank/db";

import { getSupabaseEnv } from "@/lib/env";

/** Supabase client for Client Components. Throws if Supabase is not configured. */
export function createSupabaseBrowserClient() {
  const env = getSupabaseEnv();
  if (!env) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }
  return createBrowserClient<Database>(env.url, env.anonKey);
}
