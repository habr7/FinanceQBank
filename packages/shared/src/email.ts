import { APP_NAME, LEGAL_DISCLAIMER } from "./constants";

/** Plain-text transactional email templates (provider-agnostic, no I/O). */
export interface EmailTemplate {
  subject: string;
  text: string;
}

const SIGNOFF = `\n\n— The ${APP_NAME} team\n\n${LEGAL_DISCLAIMER}`;

export function welcomeEmail(fullName?: string | null): EmailTemplate {
  const name = fullName?.trim() || "there";
  return {
    subject: `Welcome to ${APP_NAME}`,
    text:
      `Hi ${name},\n\nWelcome to ${APP_NAME} — independent CFA Level I practice with clear ` +
      `explanations and smart review. Start with a short practice session and we'll begin ` +
      `tracking your weak topics.${SIGNOFF}`,
  };
}

export function dueReviewEmail(
  fullName: string | null | undefined,
  dueCount: number,
): EmailTemplate {
  const name = fullName?.trim() || "there";
  return {
    subject: `You have ${dueCount} question${dueCount === 1 ? "" : "s"} due for review`,
    text:
      `Hi ${name},\n\nYou have ${dueCount} question${dueCount === 1 ? "" : "s"} due for review ` +
      `today. A few minutes of spaced review keeps weak topics from slipping.${SIGNOFF}`,
  };
}
