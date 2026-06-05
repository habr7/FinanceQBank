/**
 * CFA Level I topic catalogue, exam weights, and target question allocation.
 *
 * Weights mirror the public Level I topic ranges. `weight` is the planning midpoint;
 * `targetPer1000` is the canonical allocation of 1,000 published questions and sums to 1,000.
 */

export type TopicCode = "ETH" | "QM" | "ECON" | "FSA" | "CI" | "EQ" | "FI" | "DER" | "AI" | "PM";

export interface Topic {
  code: TopicCode;
  name: string;
  /** Official exam weight range (percent). */
  examWeightMin: number;
  examWeightMax: number;
  /** Planning midpoint weight (percent). */
  weight: number;
  /** Canonical target allocation per 1,000 published questions. */
  targetPer1000: number;
  displayOrder: number;
}

export const TOPICS: readonly Topic[] = [
  {
    code: "ETH",
    name: "Ethical and Professional Standards",
    examWeightMin: 15,
    examWeightMax: 20,
    weight: 17.5,
    targetPer1000: 171,
    displayOrder: 1,
  },
  {
    code: "QM",
    name: "Quantitative Methods",
    examWeightMin: 6,
    examWeightMax: 9,
    weight: 7.5,
    targetPer1000: 73,
    displayOrder: 2,
  },
  {
    code: "ECON",
    name: "Economics",
    examWeightMin: 6,
    examWeightMax: 9,
    weight: 7.5,
    targetPer1000: 73,
    displayOrder: 3,
  },
  {
    code: "FSA",
    name: "Financial Statement Analysis",
    examWeightMin: 11,
    examWeightMax: 14,
    weight: 12.5,
    targetPer1000: 122,
    displayOrder: 4,
  },
  {
    code: "CI",
    name: "Corporate Issuers",
    examWeightMin: 6,
    examWeightMax: 9,
    weight: 7.5,
    targetPer1000: 73,
    displayOrder: 5,
  },
  {
    code: "EQ",
    name: "Equity Investments",
    examWeightMin: 11,
    examWeightMax: 14,
    weight: 12.5,
    targetPer1000: 122,
    displayOrder: 6,
  },
  {
    code: "FI",
    name: "Fixed Income",
    examWeightMin: 11,
    examWeightMax: 14,
    weight: 12.5,
    targetPer1000: 122,
    displayOrder: 7,
  },
  {
    code: "DER",
    name: "Derivatives",
    examWeightMin: 5,
    examWeightMax: 8,
    weight: 6.5,
    targetPer1000: 63,
    displayOrder: 8,
  },
  {
    code: "AI",
    name: "Alternative Investments",
    examWeightMin: 7,
    examWeightMax: 10,
    weight: 8.5,
    targetPer1000: 83,
    displayOrder: 9,
  },
  {
    code: "PM",
    name: "Portfolio Management",
    examWeightMin: 8,
    examWeightMax: 12,
    weight: 10.0,
    targetPer1000: 98,
    displayOrder: 10,
  },
] as const;

export const TOPIC_CODES: readonly TopicCode[] = TOPICS.map((t) => t.code);

export const TOTAL_TARGET_QUESTIONS = 1000;

const TOPIC_BY_CODE: Record<TopicCode, Topic> = Object.fromEntries(
  TOPICS.map((t) => [t.code, t]),
) as Record<TopicCode, Topic>;

export function getTopic(code: TopicCode): Topic {
  return TOPIC_BY_CODE[code];
}

export function isTopicCode(value: string): value is TopicCode {
  return value in TOPIC_BY_CODE;
}

/**
 * Allocate `total` questions across topics proportionally to `targetPer1000`,
 * using the largest-remainder method so the parts always sum to exactly `total`.
 * Ties on the fractional remainder are broken by topic display order (stable & deterministic).
 */
export function allocateQuestions(total: number): Record<TopicCode, number> {
  if (!Number.isInteger(total) || total < 0) {
    throw new Error(`allocateQuestions expects a non-negative integer, received ${total}`);
  }

  const totalWeight = TOPICS.reduce((sum, t) => sum + t.targetPer1000, 0);

  const parts = TOPICS.map((t) => {
    const exact = (t.targetPer1000 / totalWeight) * total;
    const base = Math.floor(exact);
    return { code: t.code, order: t.displayOrder, base, frac: exact - base };
  });

  const result = Object.fromEntries(parts.map((p) => [p.code, p.base])) as Record<
    TopicCode,
    number
  >;

  let remaining = total - parts.reduce((sum, p) => sum + p.base, 0);
  const ranked = [...parts].sort((a, b) => b.frac - a.frac || a.order - b.order);

  for (let i = 0; i < ranked.length && remaining > 0; i += 1) {
    result[ranked[i]!.code] += 1;
    remaining -= 1;
  }

  return result;
}
