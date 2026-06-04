import Stripe from "stripe";
import { describe, expect, it } from "vitest";

import { computeProfilePatchFromEvent, constructStripeEvent } from "./webhook";

const stripe = new Stripe("sk_test_dummy", { typescript: true });
const secret = "whsec_test_secret";

function sign(payload: unknown): { body: string; header: string } {
  const body = JSON.stringify(payload);
  const header = stripe.webhooks.generateTestHeaderString({ payload: body, secret });
  return { body, header };
}

const subscriptionEvent = {
  id: "evt_1",
  object: "event",
  type: "customer.subscription.updated",
  data: {
    object: {
      id: "sub_1",
      object: "subscription",
      status: "active",
      customer: "cus_123",
      metadata: { userId: "user-1" },
      current_period_end: 1_900_000_000,
      items: { data: [] },
    },
  },
};

describe("constructStripeEvent (signature verification)", () => {
  it("accepts a correctly signed payload", () => {
    const { body, header } = sign(subscriptionEvent);
    const event = constructStripeEvent(stripe, body, header, secret);
    expect(event.type).toBe("customer.subscription.updated");
  });

  it("rejects a tampered payload", () => {
    const { body, header } = sign(subscriptionEvent);
    expect(() => constructStripeEvent(stripe, `${body} `, header, secret)).toThrow();
  });

  it("rejects a wrong secret", () => {
    const { body, header } = sign(subscriptionEvent);
    expect(() => constructStripeEvent(stripe, body, header, "whsec_wrong")).toThrow();
  });
});

describe("computeProfilePatchFromEvent", () => {
  it("maps an active subscription update to a profile patch", () => {
    const patch = computeProfilePatchFromEvent(subscriptionEvent as unknown as Stripe.Event);
    expect(patch).toMatchObject({
      userId: "user-1",
      stripeCustomerId: "cus_123",
      subscriptionStatus: "active",
    });
    expect(patch?.currentPeriodEnd).toBe(new Date(1_900_000_000 * 1000).toISOString());
  });

  it("maps a deleted subscription to canceled", () => {
    const event = {
      ...subscriptionEvent,
      type: "customer.subscription.deleted",
      data: { object: { ...subscriptionEvent.data.object, status: "canceled" } },
    } as unknown as Stripe.Event;
    expect(computeProfilePatchFromEvent(event)?.subscriptionStatus).toBe("canceled");
  });

  it("maps checkout.session.completed to a customer link", () => {
    const event = {
      id: "evt_2",
      object: "event",
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_1",
          object: "checkout.session",
          client_reference_id: "user-9",
          customer: "cus_999",
        },
      },
    } as unknown as Stripe.Event;
    expect(computeProfilePatchFromEvent(event)).toEqual({
      userId: "user-9",
      stripeCustomerId: "cus_999",
    });
  });

  it("ignores unrelated events", () => {
    const event = {
      id: "evt_3",
      object: "event",
      type: "payment_intent.created",
      data: { object: {} },
    } as unknown as Stripe.Event;
    expect(computeProfilePatchFromEvent(event)).toBeNull();
  });
});
