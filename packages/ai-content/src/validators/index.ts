import {
  FORBIDDEN_MARKETING_CLAIMS,
  FORBIDDEN_OPTION_PATTERNS,
  QUALIFIERS,
  TOPIC_CODES,
  allocateQuestions,
  type TopicCode,
} from "@charterbank/shared";

export interface ValidatableOption {
  label: "A" | "B" | "C";
  text: string;
  rationale?: string | null;
}

export interface ValidatableQuestion {
  topic_code: string;
  difficulty: string;
  stem: string;
  options: ValidatableOption[];
  correct_option: "A" | "B" | "C";
  explanation_md: string;
  vignette?: string | null;
  formula_md?: string | null;
  calculator_hint_md?: string | null;
  common_trap_md?: string | null;
  question_type?: string;
}

/** Every free-text surface of a question, for compliance/IP scanning. */
function allText(q: ValidatableQuestion): string {
  return [
    q.stem,
    q.vignette ?? "",
    q.explanation_md,
    q.formula_md ?? "",
    q.calculator_hint_md ?? "",
    q.common_trap_md ?? "",
    ...q.options.flatMap((o) => [o.text, o.rationale ?? ""]),
  ].join("\n");
}

export interface ValidationIssue {
  code: string;
  message: string;
}

export interface ValidationResult {
  ok: boolean;
  issues: ValidationIssue[];
}

const ok = (): ValidationResult => ({ ok: true, issues: [] });
const fail = (code: string, message: string): ValidationResult => ({
  ok: false,
  issues: [{ code, message }],
});

export function validateThreeOptions(q: ValidatableQuestion): ValidationResult {
  if (q.options.length !== 3) {
    return fail("three_options", `Expected exactly 3 options, found ${q.options.length}.`);
  }
  const labels = q.options.map((o) => o.label).sort();
  if (labels.join("") !== "ABC") {
    return fail("three_options", "Options must be labelled exactly A, B, and C.");
  }
  return ok();
}

export function validateSingleCorrectAnswer(q: ValidatableQuestion): ValidationResult {
  const match = q.options.filter((o) => o.label === q.correct_option);
  if (match.length !== 1) {
    return fail("single_correct", "correct_option must match exactly one option label.");
  }
  return ok();
}

export function validateForbiddenOptionText(q: ValidatableQuestion): ValidationResult {
  const issues: ValidationIssue[] = [];
  for (const option of q.options) {
    const text = `${option.text}\n${option.rationale ?? ""}`;
    for (const pattern of FORBIDDEN_OPTION_PATTERNS) {
      if (pattern.test(text)) {
        issues.push({
          code: "forbidden_option",
          message: `Option ${option.label} contains forbidden text matching ${pattern}.`,
        });
      }
    }
  }
  return { ok: issues.length === 0, issues };
}

/** Discouraged stem phrasings (PROJECT_BRIEF §2): except / true-false / emphatic NOT. */
export function validateStemPhrasing(q: ValidatableQuestion): ValidationResult {
  const issues: ValidationIssue[] = [];
  const checks: { pattern: RegExp; message: string }[] = [
    { pattern: /\bexcept\b/i, message: "Stem uses 'except'." },
    { pattern: /\btrue or false\b/i, message: "Stem uses a true/false framing." },
    { pattern: /\bNOT\b/, message: "Stem uses an emphatic 'NOT'." },
  ];
  for (const { pattern, message } of checks) {
    if (pattern.test(q.stem)) issues.push({ code: "stem_phrasing", message });
  }
  return { ok: issues.length === 0, issues };
}

/** Extract a single numeric value from option text (handles $, %, commas, signs). */
function parseNumeric(text: string): number | null {
  const cleaned = text.replace(/[$,%\s]/g, "");
  const match = cleaned.match(/-?\d+(\.\d+)?/);
  if (!match) return null;
  const value = Number(match[0]);
  return Number.isFinite(value) ? value : null;
}

export function validateNumericalOrdering(q: ValidatableQuestion): ValidationResult {
  const ordered = [...q.options].sort((a, b) => a.label.localeCompare(b.label));
  const numbers = ordered.map((o) => parseNumeric(o.text));
  // Only enforce when every option is numeric.
  if (numbers.some((n) => n === null)) return ok();
  for (let i = 1; i < numbers.length; i += 1) {
    if ((numbers[i] ?? 0) < (numbers[i - 1] ?? 0)) {
      return fail(
        "numeric_ordering",
        "Numerical options must be ordered from smallest to largest (A ≤ B ≤ C).",
      );
    }
  }
  return ok();
}

export function validateExplanationCompleteness(q: ValidatableQuestion): ValidationResult {
  const issues: ValidationIssue[] = [];
  if (q.explanation_md.trim().length < 100) {
    issues.push({
      code: "explanation_length",
      message: "Explanation is too short (min 100 chars).",
    });
  }
  for (const option of q.options) {
    if (!option.rationale || option.rationale.trim().length < 20) {
      issues.push({
        code: "option_rationale",
        message: `Option ${option.label} is missing a substantive rationale.`,
      });
    }
  }
  return { ok: issues.length === 0, issues };
}

export function validateNoOfficialClaims(q: ValidatableQuestion): ValidationResult {
  const haystack = allText(q);
  for (const pattern of FORBIDDEN_MARKETING_CLAIMS) {
    if (pattern.test(haystack)) {
      return fail(
        "official_claim",
        `Content contains a forbidden official-sounding claim (${pattern}).`,
      );
    }
  }
  return ok();
}

/**
 * Warning-level: conceptual items should use a CFA-style qualifier. Not part of
 * the hard gate — used to route un-qualified items to human review.
 */
export function validateQualifierPresence(q: ValidatableQuestion): ValidationResult {
  if (q.question_type === "calculation") return ok();
  const stem = q.stem.toLowerCase();
  const hasQualifier = QUALIFIERS.some((qualifier) => stem.includes(qualifier));
  return hasQualifier
    ? ok()
    : fail("missing_qualifier", "Conceptual stem lacks a CFA-style qualifier.");
}

export function validateMarkdownMath(q: ValidatableQuestion): ValidationResult {
  const text = [q.stem, q.explanation_md].join("\n");
  const dollars = (text.match(/(?<!\\)\$/g) ?? []).length;
  if (dollars % 2 !== 0) {
    return fail("markdown_math", "Unbalanced `$` delimiters in Markdown math.");
  }
  return ok();
}

/** Run every per-question deterministic validator and aggregate the issues. */
export function runDeterministicValidators(q: ValidatableQuestion): ValidationResult {
  const results = [
    validateThreeOptions(q),
    validateSingleCorrectAnswer(q),
    validateForbiddenOptionText(q),
    validateStemPhrasing(q),
    validateNumericalOrdering(q),
    validateExplanationCompleteness(q),
    validateNoOfficialClaims(q),
    validateMarkdownMath(q),
  ];
  const issues = results.flatMap((r) => r.issues);
  return { ok: issues.length === 0, issues };
}

/**
 * Batch-level check: the per-topic counts should track the official exam-weight
 * allocation within `tolerance` (as a fraction of the batch size).
 */
export function validateTopicWeightDistribution(
  counts: Partial<Record<TopicCode, number>>,
  tolerance = 0.05,
): ValidationResult {
  const total = TOPIC_CODES.reduce((sum, code) => sum + (counts[code] ?? 0), 0);
  if (total === 0) return ok();
  const target = allocateQuestions(total);
  const issues: ValidationIssue[] = [];
  const slack = Math.max(1, Math.ceil(total * tolerance));
  for (const code of TOPIC_CODES) {
    const actual = counts[code] ?? 0;
    if (Math.abs(actual - target[code]) > slack) {
      issues.push({
        code: "topic_distribution",
        message: `Topic ${code}: ${actual} vs target ${target[code]} (slack ${slack}).`,
      });
    }
  }
  return { ok: issues.length === 0, issues };
}
