/** Environment-variable contracts + a pure validator used at server startup and in CI. */

/** Required for a production deployment (auth, billing, app URL). */
export const PRODUCTION_REQUIRED_ENV: readonly string[] = [
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "STRIPE_PRICE_MONTHLY_ID",
  "STRIPE_PRICE_ANNUAL_ID",
];

/** Names of the env vars whose values must never be exposed to client code. */
export const SERVER_ONLY_ENV: readonly string[] = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_DB_URL",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "ANTHROPIC_API_KEY",
  "OPENAI_API_KEY",
];

/** Return the subset of `keys` that are missing or empty in `env`. */
export function missingEnv(
  env: Record<string, string | undefined>,
  keys: readonly string[],
): string[] {
  return keys.filter((key) => {
    const value = env[key];
    return value === undefined || value.trim() === "";
  });
}
