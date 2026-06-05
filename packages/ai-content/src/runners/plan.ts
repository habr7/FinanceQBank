import { allocateQuestions, type TopicCode } from "@charterbank/shared";

export interface PlanResult {
  curriculum: string;
  target: number;
  allocation: Record<TopicCode, number>;
}

/** Build a content production plan proportional to the official exam weights. */
export function planBatch(options: { curriculum: string; target: number }): PlanResult {
  return {
    curriculum: options.curriculum,
    target: options.target,
    allocation: allocateQuestions(options.target),
  };
}
