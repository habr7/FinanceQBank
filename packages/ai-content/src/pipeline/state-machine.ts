import type { QuestionStatus } from "../store/types";

/** Allowed status transitions for a question in the content pipeline. */
export const ALLOWED_TRANSITIONS: Record<QuestionStatus, QuestionStatus[]> = {
  draft: ["ai_validated", "quarantined"],
  ai_validated: ["human_review", "published", "quarantined"],
  human_review: ["published", "quarantined"],
  published: ["quarantined", "retired"],
  quarantined: ["draft", "retired"],
  retired: [],
};

export function canTransition(from: QuestionStatus, to: QuestionStatus): boolean {
  return from === to || ALLOWED_TRANSITIONS[from].includes(to);
}

export function assertTransition(from: QuestionStatus, to: QuestionStatus): void {
  if (!canTransition(from, to)) {
    throw new Error(`Illegal status transition: ${from} -> ${to}`);
  }
}
