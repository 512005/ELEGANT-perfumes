import { describe, expect, it } from "vitest";
import { calculateOrderTotals, getUniqueProductIds } from "./storeLogic";

describe("store logic", () => {
  it("keeps one entry per one-piece product", () => {
    expect(getUniqueProductIds([4, 4, 9, 12, 9])).toEqual([4, 9, 12]);
  });

  it("calculates subtotal, shipping, and cash-on-delivery total", () => {
    expect(calculateOrderTotals([1200, 1850], 60)).toEqual({
      subtotal: 3050,
      shippingFee: 60,
      total: 3110,
    });
  });
});
