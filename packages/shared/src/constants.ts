/** App-wide constants and compliance guards shared across packages. */

export const APP_NAME = "CharterBank";

export const LEGAL_DISCLAIMER =
  "CFA® and Chartered Financial Analyst® are registered trademarks owned by CFA Institute. " +
  "This product is an independent exam preparation tool and is not endorsed by, affiliated with, " +
  "or sponsored by CFA Institute.";

/** Option text that is never allowed in a generated question. */
export const FORBIDDEN_OPTION_PATTERNS: readonly RegExp[] = [
  /all of the above/i,
  /none of the above/i,
  /any of the above/i,
  /all of these/i,
  /none of these/i,
  /a and b only/i,
  /b and c only/i,
  /a and c only/i,
  /both a and b/i,
  /both b and c/i,
  /both a and c/i,
  /either a or b/i,
  /either b or c/i,
  /\bi and ii only\b/i,
  /\bii and iii only\b/i,
  /\bi,? ii,? and iii\b/i,
  /cannot determine/i,
  /cannot calculate/i,
  /cannot be determined/i,
  /not enough information/i,
  /insufficient information/i,
];

/** CFA-style answer qualifiers we prefer (used to route un-qualified items to review). */
export const QUALIFIERS: readonly string[] = [
  "most likely",
  "least likely",
  "best described",
  "most appropriate",
  "least appropriate",
  "most accurate",
  "least accurate",
  "best estimate",
];

/** Marketing/compliance claims that must never appear in product or content copy. */
export const FORBIDDEN_MARKETING_CLAIMS: readonly RegExp[] = [
  /official CFA/i,
  /CFA Institute approved/i,
  /guaranteed pass/i,
  /real exam questions/i,
  /actual exam/i,
  /same authors/i,
];

/** Returns the first forbidden pattern that matches `text`, or null if none do. */
export function findForbiddenMatch(text: string, patterns: readonly RegExp[]): RegExp | null {
  return patterns.find((pattern) => pattern.test(text)) ?? null;
}
