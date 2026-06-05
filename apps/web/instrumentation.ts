import { PRODUCTION_REQUIRED_ENV, missingEnv } from "@charterbank/shared";

/**
 * Runs once at server startup (Next.js instrumentation). Validates that required
 * production env vars are present and fails loudly in production if any are missing.
 * This is also where a Sentry server SDK would be initialized (see docs/DEPLOYMENT.md).
 */
export function register(): void {
  if (process.env.NODE_ENV !== "production") return;

  const missing = missingEnv(process.env, PRODUCTION_REQUIRED_ENV);
  if (missing.length > 0) {
    // Surface clearly; the platform should treat a failed boot as a failed deploy.
    console.error(`[charterbank] Missing required production env: ${missing.join(", ")}`);
  }
}
