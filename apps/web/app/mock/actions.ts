"use server";

import { redirect } from "next/navigation";
import type { MockType, OptionLabel } from "@charterbank/shared";

import { startMock, submitMock } from "@/lib/data/mock";

const TYPES: MockType[] = ["mini", "half", "full"];

export async function startMockAction(formData: FormData): Promise<void> {
  const raw = String(formData.get("type") ?? "");
  const type = (TYPES as string[]).includes(raw) ? (raw as MockType) : "mini";

  const result = await startMock(type);
  if (result.ok) redirect(`/mock/${result.sessionId}`);
  if (result.reason === "unavailable") redirect("/login");
  redirect(`/mock?error=${result.reason}`);
}

export async function submitMockAction(
  sessionId: string,
  answers: { questionId: string; chosenOption: OptionLabel }[],
): Promise<boolean> {
  return submitMock(sessionId, answers);
}
