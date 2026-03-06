import { describe, it, expect } from "vitest";
import {
  isBelowFair,
  isSelfGen,
  meetsFloor,
  commissionableRevenue,
} from "../commission";

// ─── isBelowFair ────────────────────────────────────────────

describe("isBelowFair", () => {
  it("returns true when contractTotal < fairPrice", () => {
    expect(isBelowFair(9000, 10000)).toBe(true);
  });

  it("returns false when contractTotal === fairPrice", () => {
    expect(isBelowFair(10000, 10000)).toBe(false);
  });

  it("returns false when contractTotal > fairPrice", () => {
    expect(isBelowFair(11000, 10000)).toBe(false);
  });

  it("returns false when both are zero (0 < 0 is false)", () => {
    expect(isBelowFair(0, 0)).toBe(false);
  });

  it("returns true when contractTotal is negative", () => {
    expect(isBelowFair(-500, 10000)).toBe(true);
  });

  it("returns true for very close values (9999.99 vs 10000)", () => {
    expect(isBelowFair(9999.99, 10000)).toBe(true);
  });

  it("handles floating point edge case: 0.1 + 0.2 vs 0.3", () => {
    // 0.1 + 0.2 = 0.30000000000000004 which is > 0.3
    expect(isBelowFair(0.1 + 0.2, 0.3)).toBe(false);
  });
});

// ─── isSelfGen ──────────────────────────────────────────────

describe("isSelfGen", () => {
  it("returns true when setterId is null", () => {
    expect(isSelfGen("rep-1", null)).toBe(true);
  });

  it("returns true when setterId equals salesRepId", () => {
    expect(isSelfGen("rep-1", "rep-1")).toBe(true);
  });

  it("returns false when setterId is different from salesRepId", () => {
    expect(isSelfGen("rep-1", "setter-1")).toBe(false);
  });

  it("returns true when setterId is undefined (loose equality with null)", () => {
    // The function uses `== null` which catches both null and undefined
    expect(isSelfGen("rep-1", undefined as unknown as null)).toBe(true);
  });

  it("returns true when salesRepId is empty string and setterId is null", () => {
    expect(isSelfGen("", null)).toBe(true);
  });

  it("returns true when both are the same empty string", () => {
    expect(isSelfGen("", "")).toBe(true);
  });
});

// ─── meetsFloor ─────────────────────────────────────────────

describe("meetsFloor", () => {
  it("returns true when contractTotal equals fairPrice * floor (>=)", () => {
    // 8500 >= 10000 * 0.85 = 8500
    expect(meetsFloor(8500, 10000, 0.85)).toBe(true);
  });

  it("returns false when contractTotal is just below the floor", () => {
    // 8499.99 < 10000 * 0.85 = 8500
    expect(meetsFloor(8499.99, 10000, 0.85)).toBe(false);
  });

  it("returns true only when contractTotal >= fairPrice with floor of 1.0", () => {
    expect(meetsFloor(10000, 10000, 1.0)).toBe(true);
    expect(meetsFloor(9999, 10000, 1.0)).toBe(false);
    expect(meetsFloor(10001, 10000, 1.0)).toBe(true);
  });

  it("always meets floor when floor is 0", () => {
    // fairPrice * 0 = 0, any non-negative total >= 0
    expect(meetsFloor(0, 10000, 0)).toBe(true);
    expect(meetsFloor(1, 10000, 0)).toBe(true);
    expect(meetsFloor(100000, 10000, 0)).toBe(true);
  });

  it("works with floor of 0.85 and various values", () => {
    // 10000 * 0.85 = 8500
    expect(meetsFloor(8500, 10000, 0.85)).toBe(true);
    expect(meetsFloor(9000, 10000, 0.85)).toBe(true);
    expect(meetsFloor(8000, 10000, 0.85)).toBe(false);
  });

  it("works with large numbers", () => {
    // 1_000_000 * 0.85 = 850_000
    expect(meetsFloor(850_000, 1_000_000, 0.85)).toBe(true);
    expect(meetsFloor(849_999, 1_000_000, 0.85)).toBe(false);
  });

  it("handles zero fairPrice (floor threshold becomes 0)", () => {
    // 0 * 0.85 = 0, any non-negative total >= 0
    expect(meetsFloor(0, 0, 0.85)).toBe(true);
    expect(meetsFloor(100, 0, 0.85)).toBe(true);
  });
});

// ─── commissionableRevenue ──────────────────────────────────

describe("commissionableRevenue", () => {
  it("returns contractTotal when below ceiling", () => {
    // ceiling = 10000 * 1.15 = 11500; contractTotal 10000 < 11500
    expect(commissionableRevenue(10000, 10000, 1.15)).toBe(10000);
  });

  it("returns contractTotal when it equals ceiling", () => {
    // ceiling = 10000 * 1.15 = 11500; contractTotal = 11500
    expect(commissionableRevenue(11500, 10000, 1.15)).toBe(11500);
  });

  it("returns fairPrice * ceiling when contractTotal exceeds ceiling", () => {
    // ceiling = 10000 * 1.15 = 11500; contractTotal 15000 > 11500
    expect(commissionableRevenue(15000, 10000, 1.15)).toBe(11500);
  });

  it("caps at fairPrice when ceiling is 1.0", () => {
    expect(commissionableRevenue(15000, 10000, 1.0)).toBe(10000);
    expect(commissionableRevenue(8000, 10000, 1.0)).toBe(8000);
  });

  it("caps at 2x fairPrice when ceiling is 2.0", () => {
    expect(commissionableRevenue(25000, 10000, 2.0)).toBe(20000);
    expect(commissionableRevenue(15000, 10000, 2.0)).toBe(15000);
  });

  it("caps even with very large contractTotal", () => {
    expect(commissionableRevenue(1_000_000, 10000, 1.15)).toBe(11500);
  });

  it("returns 0 when fairPrice is zero (ceiling becomes 0)", () => {
    // min(5000, 0 * 1.15) = min(5000, 0) = 0
    expect(commissionableRevenue(5000, 0, 1.15)).toBe(0);
  });
});
