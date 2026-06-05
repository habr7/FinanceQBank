"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { rerunAuditAction, setStatusAction } from "@/app/admin/actions";

export function QuestionActions({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function run(action: () => Promise<void>) {
    startTransition(async () => {
      await action();
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          disabled={pending || status === "published"}
          onClick={() =>
            run(async () => {
              const ok = await setStatusAction(id, "published");
              setMessage(ok ? "Published." : "Could not publish.");
            })
          }
        >
          Publish
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={pending || status === "quarantined"}
          onClick={() =>
            run(async () => {
              const ok = await setStatusAction(id, "quarantined");
              setMessage(ok ? "Quarantined." : "Could not quarantine.");
            })
          }
        >
          Quarantine
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={pending || status === "retired"}
          onClick={() =>
            run(async () => {
              const ok = await setStatusAction(id, "retired");
              setMessage(ok ? "Retired." : "Could not retire.");
            })
          }
        >
          Retire
        </Button>
        <Button
          size="sm"
          variant="ghost"
          disabled={pending}
          onClick={() =>
            run(async () => {
              const result = await rerunAuditAction(id);
              setMessage(
                result
                  ? result.ok
                    ? "Re-audit passed."
                    : `Re-audit failed: ${result.issues.join("; ")}`
                  : "Could not re-run audit.",
              );
            })
          }
        >
          Re-run audit
        </Button>
      </div>
      {message ? <p className="text-xs text-muted">{message}</p> : null}
    </div>
  );
}
