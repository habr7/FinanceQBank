import { describe, expect, it } from "vitest";
import { FREE_QUESTION_LIMIT } from "../src/pricing";
import { getEntitlement, mapStripeSubscriptionStatus } from "../src/billing";

describe("mapStripeSubscriptionStatus", () => {
  it("maps active/trialing/past_due to their internal equivalents", () => {
    expect(mapStripeSubscriptionStatus("active")).toBe("active");
    expect(mapStripeSubscriptionStatus("trialing")).toBe("trial");
    expect(mapStripeSubscriptionStatus("past_due")).toBe("past_due");
  });

  it("maps terminal states to canceled", () => {
    expect(mapStripeSubscriptionStatus("canceled")).toBe("canceled");
    expect(mapStripeSubscriptionStatus("unpaid")).toBe("canceled");
    expect(mapStripeSubscriptionStatus("incomplete_expired")).toBe("canceled");
  });

  it("never grants access for unknown/incomplete states", () => {
    expect(mapStripeSubscriptionStatus("incomplete")).toBe("free");
    expect(mapStripeSubscriptionStatus("paused")).toBe("free");
    expect(mapStripeSubscriptionStatus("something_new")).toBe("free");
  });
});

describe("getEntitlement", () => {
  it("gives unlimited access to paid statuses regardless of count", () => {
    for (const status of ["active", "trial"]) {
      const ent = getEntitlement(status, 999);
      expect(ent).toMatchObject({ unlimited: true, limit: null, remaining: null, canAnswer: true });
    }
  });

  it("caps free users at the free question limit", () => {
    expect(getEntitlement("free", 0)).toMatchObject({
      unlimited: false,
      limit: FREE_QUESTION_LIMIT,
      remaining: FREE_QUESTION_LIMIT,
      canAnswer: true,
    });
    expect(getEntitlement("free", FREE_QUESTION_LIMIT - 1)).toMatchObject({
      remaining: 1,
      canAnswer: true,
    });
    expect(getEntitlement("free", FREE_QUESTION_LIMIT)).toMatchObject({
      remaining: 0,
      canAnswer: false,
    });
    expect(getEntitlement("past_due", 5)).toMatchObject({ unlimited: false, canAnswer: true });
  });

  it("treats past_due / canceled as free (not unlimited)", () => {
    expect(getEntitlement("canceled", FREE_QUESTION_LIMIT).canAnswer).toBe(false);
  });
});
