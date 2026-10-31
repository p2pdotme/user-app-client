import { describe, expect, it } from "vitest";
import { makeDisputedOrder, makeOrder } from "./factories";

describe("order factories", () => {
  it("defaults to no dispute", () => {
    expect(makeOrder().disputeInfo.status).toBe("DEFAULT");
  });

  it("makes a disputed order", () => {
    expect(makeDisputedOrder().disputeInfo.status).toBe("RAISED");
  });
});
