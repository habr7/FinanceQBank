"use client";

import { useState, type FormEvent } from "react";
import { APP_NAME } from "@charterbank/shared";

import { Button } from "@/components/ui/button";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Status = { kind: "idle" | "sent" | "error"; message?: string };

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [pending, setPending] = useState(false);
  const configured = isSupabaseConfigured();

  async function sendMagicLink(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setStatus({ kind: "idle" });
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) throw error;
      setStatus({ kind: "sent", message: "Check your inbox for a magic link to sign in." });
    } catch (error) {
      setStatus({
        kind: "error",
        message: error instanceof Error ? error.message : "Sign-in failed.",
      });
    } finally {
      setPending(false);
    }
  }

  async function signInWithGoogle() {
    setPending(true);
    setStatus({ kind: "idle" });
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) throw error;
    } catch (error) {
      setStatus({
        kind: "error",
        message: error instanceof Error ? error.message : "Sign-in failed.",
      });
      setPending(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-8 px-6 py-16">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">Sign in to {APP_NAME}</h1>
        <p className="text-sm text-muted">
          No password needed — sign in with a magic link or with Google.
        </p>
      </div>

      {!configured ? (
        <p role="status" className="rounded-md border border-border p-4 text-sm text-muted">
          Authentication is not configured in this environment. Set the Supabase environment
          variables to enable sign-in.
        </p>
      ) : (
        <>
          <form onSubmit={sendMagicLink} className="flex flex-col gap-3">
            <label htmlFor="email" className="text-sm font-medium">
              Email address
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="h-10 rounded-md border border-border bg-transparent px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400"
            />
            <Button type="submit" disabled={pending}>
              {pending ? "Sending…" : "Send magic link"}
            </Button>
          </form>

          <div className="flex items-center gap-3 text-xs text-muted">
            <span className="h-px flex-1 bg-border" />
            or
            <span className="h-px flex-1 bg-border" />
          </div>

          <Button variant="outline" onClick={signInWithGoogle} disabled={pending}>
            Continue with Google
          </Button>
        </>
      )}

      {status.kind !== "idle" && status.message ? (
        <p
          role="status"
          className={
            status.kind === "error"
              ? "text-sm text-red-600 dark:text-red-400"
              : "text-sm text-muted"
          }
        >
          {status.message}
        </p>
      ) : null}
    </main>
  );
}
