"use client";

import { useEffect } from "react";

/**
 * Product analytics (PostHog). Initializes only when NEXT_PUBLIC_POSTHOG_KEY is set,
 * so local/dev and unconfigured environments stay clean. Renders nothing.
 */
export function Analytics() {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key) return;
    let cancelled = false;
    void import("posthog-js").then(({ default: posthog }) => {
      if (cancelled) return;
      posthog.init(key, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://app.posthog.com",
        capture_pageview: true,
        person_profiles: "identified_only",
      });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
