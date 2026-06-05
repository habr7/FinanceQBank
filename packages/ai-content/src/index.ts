/**
 * @charterbank/ai-content — batch content pipeline (PROJECT_BRIEF §9–11).
 *
 * Questions are NEVER generated in real time for students. The flow is
 * blueprint -> generate -> independently solve -> validate -> adversarial review
 * -> IP check -> gate -> (human review) -> publish, with quarantine on any failure.
 * See docs/AI_PIPELINE.md.
 */
export * from "./schemas";
export * from "./validators";
export * from "./gates";
export * from "./agents";
export * from "./store";
export * from "./runners";
export * from "./pipeline/state-machine";
export { SOURCE_CORPUS } from "./fixtures/source-corpus";
export { getPrompt, PROMPT_VERSION, type PromptName, type LoadedPrompt } from "./prompts";

export const AI_CONTENT_PACKAGE_READY = true;
