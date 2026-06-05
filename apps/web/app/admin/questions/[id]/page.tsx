import Link from "next/link";
import { notFound } from "next/navigation";

import { cn } from "@/lib/utils";
import { getAdminQuestion } from "@/lib/data/admin";
import { QuestionActions } from "@/components/admin/question-actions";

export const dynamic = "force-dynamic";

export default async function AdminQuestionDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getAdminQuestion(id);
  if (!detail) notFound();

  const { question, options, audits, reports } = detail;

  return (
    <main className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <Link href="/admin" className="text-sm text-muted underline">
          ← Back to questions
        </Link>
        <span className="rounded-full border border-border px-3 py-1 text-xs">
          {question.status}
        </span>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted">
        <span className="rounded-full border border-border px-2 py-0.5">{question.topic_code}</span>
        <span className="rounded-full border border-border px-2 py-0.5 capitalize">
          {question.difficulty}
        </span>
        {question.objective_code ? (
          <span className="rounded-full border border-border px-2 py-0.5">
            {question.objective_code}
          </span>
        ) : null}
      </div>

      {question.vignette ? (
        <p className="whitespace-pre-wrap text-sm text-muted">{question.vignette}</p>
      ) : null}
      <h1 className="text-lg font-medium">{question.stem}</h1>

      <ul className="flex flex-col gap-2">
        {options.map((o) => (
          <li
            key={o.label}
            className={cn(
              "rounded-md border border-border p-3 text-sm",
              o.label === question.correct_option &&
                "border-green-600 bg-green-50 dark:bg-green-950",
            )}
          >
            <span className="font-semibold">{o.label}.</span> {o.option_text}
            {o.label === question.correct_option ? (
              <span className="ml-2 text-xs text-green-700 dark:text-green-400">(correct)</span>
            ) : null}
            {o.rationale_md ? <p className="mt-1 text-xs text-muted">{o.rationale_md}</p> : null}
          </li>
        ))}
      </ul>

      <section className="rounded-md bg-neutral-50 p-4 text-sm dark:bg-neutral-900">
        <h2 className="font-semibold">Explanation</h2>
        <p className="mt-1 whitespace-pre-wrap">{question.explanation_md}</p>
      </section>

      <section className="grid grid-cols-2 gap-3 text-xs text-muted sm:grid-cols-4">
        <Meta label="Quality" value={question.quality_score} />
        <Meta label="AI confidence" value={question.ai_confidence} />
        <Meta label="IP similarity" value={question.ip_similarity_score} />
        <Meta label="Prompt" value={question.prompt_version} />
        <Meta label="Generator" value={question.generated_by_model} />
        <Meta label="Validator" value={question.validated_by_model} />
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold">Audit history</h2>
        {audits.length === 0 ? (
          <p className="text-xs text-muted">No audits recorded.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border rounded-md border border-border text-xs">
            {audits.map((a) => (
              <li key={a.id} className="flex items-center justify-between px-3 py-2">
                <span>
                  <span className="font-medium">{a.audit_type}</span> · {a.result}
                  {a.model ? <span className="text-muted"> · {a.model}</span> : null}
                </span>
                <span className="text-muted">{new Date(a.created_at).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold">User reports ({reports.length})</h2>
        {reports.length === 0 ? (
          <p className="text-xs text-muted">No reports.</p>
        ) : (
          <ul className="flex flex-col gap-2 text-xs">
            {reports.map((r) => (
              <li key={r.id} className="rounded-md border border-border p-2">
                <span className="font-medium">{r.report_type}</span> · {r.status}
                {r.message ? <p className="mt-1 text-muted">{r.message}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="border-t border-border pt-4">
        <QuestionActions id={question.id} status={question.status} />
      </section>
    </main>
  );
}

function Meta({ label, value }: { label: string; value: string | number | null }) {
  return (
    <div className="rounded-md border border-border p-2">
      <p>{label}</p>
      <p className="mt-0.5 font-medium text-foreground">{value ?? "—"}</p>
    </div>
  );
}
