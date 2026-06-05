import "server-only";

/**
 * Single chokepoint for server-side error reporting. Default behavior is a
 * structured console log (captured by the platform's log drain). In production,
 * forward these to Sentry — see docs/DEPLOYMENT.md for the SDK wiring step.
 * Never include secrets or raw request bodies in `context`.
 */
export function reportError(error: unknown, context?: Record<string, unknown>): void {
  const message = error instanceof Error ? error.message : String(error);
  console.error("[charterbank:error]", JSON.stringify({ message, ...context }));
}
