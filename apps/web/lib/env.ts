/**
 * Public Supabase env access. Reads the NEXT_PUBLIC_* values that are safe to
 * expose to the browser. Returns null when unconfigured so the app can build and
 * run locally (e.g. the marketing pages) without Supabase credentials present.
 */
export interface SupabaseEnv {
  url: string;
  anonKey: string;
}

export function getSupabaseEnv(): SupabaseEnv | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return { url, anonKey };
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseEnv() !== null;
}
