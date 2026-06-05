import { describe, expect, it } from "vitest";
import { assertTransition, canTransition } from "../src/pipeline/state-machine";

describe("question status state machine", () => {
  it("does NOT allow publishing a raw draft (must pass the gate first)", () => {
    expect(canTransition("draft", "published")).toBe(false);
    expect(canTransition("draft", "ai_validated")).toBe(true);
    expect(canTransition("draft", "quarantined")).toBe(true);
  });

  it("allows publishing only from ai_validated or human_review", () => {
    expect(canTransition("ai_validated", "published")).toBe(true);
    expect(canTransition("human_review", "published")).toBe(true);
  });

  it("allows quarantine/retire from published and recovery from quarantine", () => {
    expect(canTransition("published", "quarantined")).toBe(true);
    expect(canTransition("published", "retired")).toBe(true);
    expect(canTransition("quarantined", "draft")).toBe(true);
  });

  it("treats retired as terminal", () => {
    expect(canTransition("retired", "published")).toBe(false);
    expect(canTransition("retired", "draft")).toBe(false);
  });

  it("assertTransition throws on an illegal transition", () => {
    expect(() => assertTransition("draft", "published")).toThrow(/Illegal status transition/);
    expect(() => assertTransition("ai_validated", "published")).not.toThrow();
  });
});
