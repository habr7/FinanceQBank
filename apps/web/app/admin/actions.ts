"use server";

import { revalidatePath } from "next/cache";
import type { QuestionStatus, ReportStatus } from "@charterbank/db";

import { getAdminContext } from "@/lib/auth/admin";
import {
  rerunDeterministicAudit,
  setQuestionStatus,
  triageReport,
  type RerunAuditResult,
} from "@/lib/data/admin";

const PUBLISHABLE: QuestionStatus[] = ["published", "quarantined", "retired"];
const REPORT_STATUSES: ReportStatus[] = ["open", "triaged", "fixed", "wont_fix"];

export async function setStatusAction(id: string, status: QuestionStatus): Promise<boolean> {
  if (!(await getAdminContext())) return false;
  if (!PUBLISHABLE.includes(status)) return false;
  const ok = await setQuestionStatus(id, status);
  revalidatePath(`/admin/questions/${id}`);
  revalidatePath("/admin");
  return ok;
}

export async function rerunAuditAction(id: string): Promise<RerunAuditResult | null> {
  if (!(await getAdminContext())) return null;
  const result = await rerunDeterministicAudit(id);
  revalidatePath(`/admin/questions/${id}`);
  revalidatePath("/admin");
  return result;
}

export async function triageReportAction(
  id: string,
  status: string,
  notes: string,
): Promise<boolean> {
  if (!(await getAdminContext())) return false;
  const reportStatus = (REPORT_STATUSES as string[]).includes(status)
    ? (status as ReportStatus)
    : "triaged";
  const ok = await triageReport(id, reportStatus, notes);
  revalidatePath("/admin/reports");
  return ok;
}
