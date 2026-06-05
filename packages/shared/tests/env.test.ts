import { describe, expect, it } from "vitest";
import { PRODUCTION_REQUIRED_ENV, SERVER_ONLY_ENV, missingEnv } from "../src/env";

describe("missingEnv", () => {
  it("reports undefined and empty values as missing", () => {
    const env = { A: "x", B: "", C: "   ", D: undefined };
    expect(missingEnv(env, ["A", "B", "C", "D"])).toEqual(["B", "C", "D"]);
  });

  it("returns empty when all required keys are present", () => {
    const env = Object.fromEntries(PRODUCTION_REQUIRED_ENV.map((k) => [k, "value"]));
    expect(missingEnv(env, PRODUCTION_REQUIRED_ENV)).toEqual([]);
  });

  it("never lists a public key among the server-only secrets", () => {
    expect(SERVER_ONLY_ENV.some((k) => k.startsWith("NEXT_PUBLIC_"))).toBe(false);
  });
});
