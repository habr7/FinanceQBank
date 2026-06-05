import Link from "next/link";

import { listAdminReports } from "@/lib/data/admin";
import { ReportTriage } from "@/components/admin/report-triage";

export const dynamic = "force-dynamic";

export default async function AdminReportsPage() {
  const reports = await listAdminReports();

  return (
    <main className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">User reports</h1>

      {reports.length === 0 ? (
        <p className="text-sm text-muted">No reports filed.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {reports.map((r) => (
            <li
              key={r.id}
              className="flex flex-col gap-2 rounded-md border border-border p-4 text-sm"
            >
              <div className="flex items-center justify-between">
                <span>
                  <span className="font-medium">{r.report_type}</span> ·{" "}
                  <span className="text-muted">{r.status}</span>
                </span>
                <Link href={`/admin/questions/${r.question_id}`} className="text-xs underline">
                  View question
                </Link>
              </div>
              {r.message ? <p className="text-muted">{r.message}</p> : null}
              {r.admin_notes ? (
                <p className="text-xs text-muted">Admin notes: {r.admin_notes}</p>
              ) : null}
              <ReportTriage id={r.id} currentStatus={r.status} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
