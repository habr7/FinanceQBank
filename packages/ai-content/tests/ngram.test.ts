import { describe, expect, it } from "vitest";
import { ipRisk, jaccard, shingles } from "../src/utils/ngram";

describe("n-gram similarity", () => {
  it("scores identical text as fully similar", () => {
    const text = "the quick brown fox jumps over the lazy dog";
    expect(jaccard(shingles(text), shingles(text))).toBe(1);
  });

  it("scores disjoint text as zero", () => {
    expect(jaccard(shingles("alpha beta gamma delta"), shingles("one two three four"))).toBe(0);
  });

  it("ipRisk returns the max overlap across the corpus", () => {
    const corpus = ["completely unrelated content here", "the quick brown fox jumps over"];
    const risk = ipRisk("the quick brown fox jumps over the lazy dog", corpus);
    expect(risk).toBeGreaterThan(0.2);
  });

  it("original text has low overlap with the corpus", () => {
    const corpus = ["duration approximates bond price sensitivity to yield changes"];
    expect(ipRisk("an investor compares two mutual funds by expense ratio", corpus)).toBeLessThan(
      0.35,
    );
  });
});
