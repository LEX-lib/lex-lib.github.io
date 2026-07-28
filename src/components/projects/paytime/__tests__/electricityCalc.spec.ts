import { describe, expect, it } from "vitest";
import { calculateShares } from "../electricityCalc";

describe("calculateShares", () => {
  // The user's own example: 362 kWh for Php 5193.16, one 100 kWh sub-meter.
  it("splits the July example bill correctly", () => {
    const result = calculateShares(
      362,
      5193.16,
      [{ label: "Sub-Meter 1", readingFrom: 200, readingTo: 300 }],
      4,
    );

    expect(result).not.toBeNull();
    const shares = result!;
    expect(shares.pricePerKwh).toBeCloseTo(14.3457, 3);
    expect(shares.subMeters[0].kwh).toBe(100);
    expect(shares.subMeters[0].amount).toBeCloseTo(1434.57, 1);
    expect(shares.group1Kwh).toBe(262);
    expect(shares.group1Amount).toBeCloseTo(3758.59, 1);
    expect(shares.perPersonAmount).toBeCloseTo(939.65, 1);
  });

  it("handles no sub-meters", () => {
    const shares = calculateShares(100, 1500, [], 2)!;
    expect(shares.group1Kwh).toBe(100);
    expect(shares.perPersonAmount).toBeCloseTo(750, 5);
  });

  it("returns null for non-positive totals", () => {
    expect(calculateShares(0, 5000, [], 2)).toBeNull();
    expect(calculateShares(100, 0, [], 2)).toBeNull();
    expect(calculateShares(NaN, 5000, [], 2)).toBeNull();
  });

  it("group total plus sub-meter totals equal the bill", () => {
    const shares = calculateShares(
      362,
      5193.16,
      [
        { label: "A", readingFrom: 0, readingTo: 100 },
        { label: "B", readingFrom: 50, readingTo: 90 },
      ],
      3,
    )!;
    const subTotal = shares.subMeters.reduce((sum, s) => sum + s.amount, 0);
    expect(shares.group1Amount + subTotal).toBeCloseTo(5193.16, 5);
  });
});
