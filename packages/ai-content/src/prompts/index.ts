import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/** Bump when any prompt changes so questions remain traceable to their prompt. */
export const PROMPT_VERSION = "v1";

const here = dirname(fileURLToPath(import.meta.url));

export type PromptName = "blueprint" | "generator" | "solver" | "validator" | "adversarial" | "ip";

export interface LoadedPrompt {
  name: PromptName;
  version: string;
  system: string;
}

export function getPrompt(name: PromptName): LoadedPrompt {
  const system = readFileSync(join(here, `${name}.${PROMPT_VERSION}.md`), "utf8");
  return { name, version: PROMPT_VERSION, system };
}
