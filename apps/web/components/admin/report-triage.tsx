"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { triageReportAction } from "@/app/admin/actions";

const STATUSES = ["open", "triaged", "fixed", "wont_fix"];

export function ReportTriage({ id, currentStatus }: { id: string; currentStatus: string }) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [notes, setNotes] = useState("");
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <form
      className="flex flex-wrap items-center gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        startTransition(async () => {
          const ok = await triageReportAction(id, status, notes);
          setMessage(ok ? "Saved." : "Could not save.");
          router.refresh();
        });
      }}
    >
      <select
        value={status}
        onChange={(event) => setStatus(event.target.value)}
        aria-label="Report status"
        className="h-8 rounded-md border border-border bg-transparent px-2 text-sm"
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <input
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        placeholder="Admin notes…"
        className="h-8 flex-1 rounded-md border border-border bg-transparent px-2 text-sm"
      />
      <Button size="sm" type="submit" disabled={pending}>
        Save
      </Button>
      {message ? <span className="text-xs text-muted">{message}</span> : null}
    </form>
  );
}
