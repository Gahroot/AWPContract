import { describe, it, expect } from "vitest";
import {
  calculateCommissionsPreview,
  type CommissionContext,
  type CommissionOverrideMap,
} from "../commission";

// ─── Default settings matching source ────────────────────────

const DEFAULT_SETTINGS = {
  salesRepRate: 0.10,
  salesRepRateBelowFair: 0.05,
  salesRepFloor: 0.85,
  salesRepCeiling: 1.15,
  setterRate: 0.03,
  setterFloor: 0.85,
  setterManagerRate: 0.02,
  setterManagerRateBelowFair: 0.01,
  territoryOwnerRateTier1: 0.01,
  territoryOwnerRateTier2: 0.015,
  territoryOwnerRateTier3: 0.02,
  territoryOwnerTier2Threshold: 500000,
  territoryOwnerTier3Threshold: 1000000,
  vpRate: 0.01,
  vpRateBelowFair: 0.005,
  nsmRate: 0.005,
  nsmRateBelowFair: 0.0025,
  traditionalSalesRepRate: 0.12,
  traditionalSalesRepRateBelowFair: 0.07,
  traditionalFloorRate: 0.85,
  traditionalPriceCeiling: 1.15,
  traditionalNsmOverrideRate: 0.005,
  traditionalNsmOverrideRateBelowFair: 0.0025,
};

const EMPTY_MGMT = {
  setterManagers: [],
  territoryOwners: [],
  vps: [],
  nsms: [],
  salesRepTerritoryId: null,
  cumulativeRevenue: 0,
};

function makeCtx(overrides: Partial<CommissionContext> = {}): CommissionContext {
  return {
    contractId: "contract-1",
    contractTotal: 10000,
    fairPrice: 10000,
    salesRepId: "rep-1",
    setterId: null,
    ...overrides,
  };
}

describe("calculateCommissionsPreview edge cases", () => {
  // ─── 1. Zero contract total ────────────────────────────────
  it("returns empty array for zero contract total", () => {
    const result = calculateCommissionsPreview(
      makeCtx({ contractTotal: 0 }),
      DEFAULT_SETTINGS,
      EMPTY_MGMT,
    );
    expect(result).toEqual([]);
  });

  // ─── 2. Negative contract total ────────────────────────────
  it("returns empty array for negative contract total", () => {
    const result = calculateCommissionsPreview(
      makeCtx({ contractTotal: -500 }),
      DEFAULT_SETTINGS,
      EMPTY_MGMT,
    );
    expect(result).toEqual([]);
  });

  // ─── 3. Empty salesRepId ───────────────────────────────────
  it("returns empty array for empty salesRepId", () => {
    const result = calculateCommissionsPreview(
      makeCtx({ salesRepId: "" }),
      DEFAULT_SETTINGS,
      EMPTY_MGMT,
    );
    expect(result).toEqual([]);
  });

  // ─── 4. contractTotal exactly at floor ─────────────────────
  it("qualifies when contractTotal is exactly at floor (fairPrice * 0.85)", () => {
    const fairPrice = 10000;
    const contractTotal = fairPrice * 0.85; // exactly 8500
    const result = calculateCommissionsPreview(
      makeCtx({ contractTotal, fairPrice }),
      DEFAULT_SETTINGS,
      EMPTY_MGMT,
    );
    expect(result.length).toBeGreaterThan(0);
    const salesRep = result.find((e) => e.commissionType === "SALES_REP");
    expect(salesRep).toBeDefined();
  });

  // ─── 5. contractTotal one cent below floor ─────────────────
  it("does NOT qualify when contractTotal is one cent below floor", () => {
    const fairPrice = 10000;
    const contractTotal = fairPrice * 0.85 - 0.01; // 8499.99
    const result = calculateCommissionsPreview(
      makeCtx({ contractTotal, fairPrice }),
      DEFAULT_SETTINGS,
      EMPTY_MGMT,
    );
    const salesRep = result.find((e) => e.commissionType === "SALES_REP");
    expect(salesRep).toBeUndefined();
  });

  // ─── 6. contractTotal exactly at ceiling ───────────────────
  it("caps commissionable revenue at ceiling (fairPrice * 1.15)", () => {
    const fairPrice = 10000;
    const contractTotal = fairPrice * 1.15; // exactly 11500
    const result = calculateCommissionsPreview(
      makeCtx({ contractTotal, fairPrice }),
      DEFAULT_SETTINGS,
      EMPTY_MGMT,
    );
    const salesRep = result.find((e) => e.commissionType === "SALES_REP");
    expect(salesRep).toBeDefined();
    // Self-gen (no setter): traditional rate 12%, revenue capped at 11500
    expect(salesRep!.amount).toBe(Math.round(11500 * 0.12 * 100) / 100);
  });

  // ─── 7. contractTotal above ceiling → capped ──────────────
  it("caps commissionable revenue when contractTotal exceeds ceiling", () => {
    const fairPrice = 10000;
    const contractTotal = 15000; // well above ceiling of 11500
    const result = calculateCommissionsPreview(
      makeCtx({ contractTotal, fairPrice }),
      DEFAULT_SETTINGS,
      EMPTY_MGMT,
    );
    const salesRep = result.find((e) => e.commissionType === "SALES_REP");
    expect(salesRep).toBeDefined();
    // Self-gen: traditional ceiling = 1.15, revenue capped at 10000 * 1.15 = 11500
    const cappedRevenue = 10000 * 1.15;
    expect(salesRep!.amount).toBe(Math.round(cappedRevenue * 0.12 * 100) / 100);
  });

  // ─── 8. fairPrice of 0 ────────────────────────────────────
  it("handles fairPrice of 0", () => {
    // floor = 0 * 0.85 = 0, contractTotal > 0 so meetsFloor passes
    // ceiling = 0 * 1.15 = 0, commissionableRevenue = min(10000, 0) = 0
    const result = calculateCommissionsPreview(
      makeCtx({ contractTotal: 10000, fairPrice: 0 }),
      DEFAULT_SETTINGS,
      EMPTY_MGMT,
    );
    const salesRep = result.find((e) => e.commissionType === "SALES_REP");
    expect(salesRep).toBeDefined();
    // Revenue capped at 0, so amount = 0
    expect(salesRep!.amount).toBe(0);
  });

  // ─── 9. Very large numbers ($10M contract) ────────────────
  it("handles very large contract totals ($10M)", () => {
    const contractTotal = 10_000_000;
    const fairPrice = 10_000_000;
    const result = calculateCommissionsPreview(
      makeCtx({ contractTotal, fairPrice }),
      DEFAULT_SETTINGS,
      EMPTY_MGMT,
    );
    const salesRep = result.find((e) => e.commissionType === "SALES_REP");
    expect(salesRep).toBeDefined();
    // Self-gen at fair price: 12% of $10M = $1,200,000
    expect(salesRep!.amount).toBe(1_200_000);
  });

  // ─── 10. Very small numbers ($0.01 contract) ──────────────
  it("handles very small contract totals ($0.01)", () => {
    const contractTotal = 0.01;
    const fairPrice = 0.01;
    const result = calculateCommissionsPreview(
      makeCtx({ contractTotal, fairPrice }),
      DEFAULT_SETTINGS,
      EMPTY_MGMT,
    );
    const salesRep = result.find((e) => e.commissionType === "SALES_REP");
    expect(salesRep).toBeDefined();
    // 0.01 * 0.12 = 0.0012, rounded = 0.00
    expect(salesRep!.amount).toBe(0);
  });

  // ─── 11. Territory tier exact thresholds ──────────────────
  describe("territory tier thresholds", () => {
    const mgmtWithTerritory = (cumulativeRevenue: number) => ({
      setterManagers: [],
      territoryOwners: [{ id: "owner-1" }],
      vps: [],
      nsms: [],
      salesRepTerritoryId: "territory-1",
      cumulativeRevenue,
    });

    it("uses Tier 2 rate when cumulative revenue is exactly 500000", () => {
      const result = calculateCommissionsPreview(
        makeCtx(),
        DEFAULT_SETTINGS,
        mgmtWithTerritory(500_000),
      );
      const territory = result.find((e) => e.commissionType === "TERRITORY_OWNER");
      expect(territory).toBeDefined();
      expect(territory!.rate).toBe(0.015);
      expect(territory!.tierLabel).toBe("Tier 2");
    });

    it("uses Tier 3 rate when cumulative revenue is exactly 1000000", () => {
      const result = calculateCommissionsPreview(
        makeCtx(),
        DEFAULT_SETTINGS,
        mgmtWithTerritory(1_000_000),
      );
      const territory = result.find((e) => e.commissionType === "TERRITORY_OWNER");
      expect(territory).toBeDefined();
      expect(territory!.rate).toBe(0.02);
      expect(territory!.tierLabel).toBe("Tier 3");
    });

    // ─── 12. Just below tier 2 ──────────────────────────────
    it("uses Tier 1 rate when cumulative revenue is 499999.99 (just below Tier 2)", () => {
      const result = calculateCommissionsPreview(
        makeCtx(),
        DEFAULT_SETTINGS,
        mgmtWithTerritory(499_999.99),
      );
      const territory = result.find((e) => e.commissionType === "TERRITORY_OWNER");
      expect(territory).toBeDefined();
      expect(territory!.rate).toBe(0.01);
      expect(territory!.tierLabel).toBe("Tier 1");
    });

    it("uses Tier 2 rate when cumulative revenue is 999999.99 (just below Tier 3)", () => {
      const result = calculateCommissionsPreview(
        makeCtx(),
        DEFAULT_SETTINGS,
        mgmtWithTerritory(999_999.99),
      );
      const territory = result.find((e) => e.commissionType === "TERRITORY_OWNER");
      expect(territory).toBeDefined();
      expect(territory!.rate).toBe(0.015);
      expect(territory!.tierLabel).toBe("Tier 2");
    });
  });

  // ─── 13. Override rate of 0 ────────────────────────────────
  it("produces $0 commission with override rate of 0", () => {
    const overrides: CommissionOverrideMap = { "rep-1:SALES_REP": 0 };
    const result = calculateCommissionsPreview(
      makeCtx(),
      DEFAULT_SETTINGS,
      EMPTY_MGMT,
      overrides,
    );
    const salesRep = result.find((e) => e.commissionType === "SALES_REP");
    expect(salesRep).toBeDefined();
    expect(salesRep!.rate).toBe(0);
    expect(salesRep!.amount).toBe(0);
    expect(salesRep!.notes).toBe("Custom rate override");
  });

  // ─── 14. Override rate of 1.0 (100%) ──────────────────────
  it("produces commission equal to capped revenue with 100% override rate", () => {
    const fairPrice = 10000;
    const contractTotal = 10000;
    const overrides: CommissionOverrideMap = { "rep-1:SALES_REP": 1.0 };
    const result = calculateCommissionsPreview(
      makeCtx({ contractTotal, fairPrice }),
      DEFAULT_SETTINGS,
      EMPTY_MGMT,
      overrides,
    );
    const salesRep = result.find((e) => e.commissionType === "SALES_REP");
    expect(salesRep).toBeDefined();
    // Self-gen: revenue = min(10000, 10000 * 1.15) = 10000; amount = 10000 * 1.0
    expect(salesRep!.amount).toBe(10000);
  });

  // ─── 15. Negative override rate ───────────────────────────
  it("produces negative commission with negative override rate", () => {
    const overrides: CommissionOverrideMap = { "rep-1:SALES_REP": -0.05 };
    const result = calculateCommissionsPreview(
      makeCtx({ contractTotal: 10000, fairPrice: 10000 }),
      DEFAULT_SETTINGS,
      EMPTY_MGMT,
      overrides,
    );
    const salesRep = result.find((e) => e.commissionType === "SALES_REP");
    expect(salesRep).toBeDefined();
    expect(salesRep!.amount).toBe(-500);
  });

  // ─── 16. All management empty, territory owner present ────
  it("includes territory owner when all other management is empty", () => {
    const mgmt = {
      setterManagers: [],
      territoryOwners: [{ id: "owner-1" }],
      vps: [],
      nsms: [],
      salesRepTerritoryId: "territory-1",
      cumulativeRevenue: 0,
    };
    const result = calculateCommissionsPreview(
      makeCtx(),
      DEFAULT_SETTINGS,
      mgmt,
    );
    const types = result.map((e) => e.commissionType);
    expect(types).toContain("SALES_REP");
    expect(types).toContain("TERRITORY_OWNER");
    expect(types).not.toContain("SETTER_MANAGER");
    expect(types).not.toContain("VP");
    expect(types).not.toContain("NSM");
  });

  // ─── 17. Territory owner without territoryId ──────────────
  it("produces no territory entries when salesRepTerritoryId is null", () => {
    const mgmt = {
      setterManagers: [],
      territoryOwners: [{ id: "owner-1" }],
      vps: [],
      nsms: [],
      salesRepTerritoryId: null,
      cumulativeRevenue: 100000,
    };
    const result = calculateCommissionsPreview(
      makeCtx(),
      DEFAULT_SETTINGS,
      mgmt,
    );
    const territory = result.find((e) => e.commissionType === "TERRITORY_OWNER");
    expect(territory).toBeUndefined();
  });

  // ─── 18. Same user as sales rep and VP/NSM ────────────────
  it("creates separate entries when salesRepId is also a VP and NSM", () => {
    const userId = "rep-1";
    const mgmt = {
      setterManagers: [],
      territoryOwners: [],
      vps: [{ id: userId }],
      nsms: [{ id: userId }],
      salesRepTerritoryId: null,
      cumulativeRevenue: 0,
    };
    const result = calculateCommissionsPreview(
      makeCtx({ salesRepId: userId }),
      DEFAULT_SETTINGS,
      mgmt,
    );
    const salesRepEntries = result.filter((e) => e.commissionType === "SALES_REP");
    const vpEntries = result.filter((e) => e.commissionType === "VP");
    const nsmEntries = result.filter((e) => e.commissionType === "NSM");
    expect(salesRepEntries).toHaveLength(1);
    expect(vpEntries).toHaveLength(1);
    expect(nsmEntries).toHaveLength(1);
    // All three should have the same userId
    expect(salesRepEntries[0].userId).toBe(userId);
    expect(vpEntries[0].userId).toBe(userId);
    expect(nsmEntries[0].userId).toBe(userId);
  });

  // ─── 19. Rounding precision (floating point edge cases) ───
  it("rounds amounts to 2 decimal places avoiding floating point drift", () => {
    // $333.33 * 0.12 = 39.9996 → should round to 40.00
    const contractTotal = 333.33;
    const fairPrice = 333.33;
    const result = calculateCommissionsPreview(
      makeCtx({ contractTotal, fairPrice }),
      DEFAULT_SETTINGS,
      EMPTY_MGMT,
    );
    const salesRep = result.find((e) => e.commissionType === "SALES_REP");
    expect(salesRep).toBeDefined();
    // Verify it's a clean 2-decimal number
    const decimalStr = salesRep!.amount.toString();
    const parts = decimalStr.split(".");
    if (parts.length > 1) {
      expect(parts[1].length).toBeLessThanOrEqual(2);
    }
    expect(salesRep!.amount).toBe(Math.round(333.33 * 0.12 * 100) / 100);
  });

  it("handles repeating decimal amounts correctly", () => {
    // $100.01 * 0.03 = 3.0003 → should round to 3.00
    const mgmt = {
      ...EMPTY_MGMT,
      setterManagers: [{ id: "mgr-1" }],
    };
    const result = calculateCommissionsPreview(
      makeCtx({ contractTotal: 100.01, fairPrice: 100.01 }),
      DEFAULT_SETTINGS,
      mgmt,
    );
    const mgrEntry = result.find((e) => e.commissionType === "SETTER_MANAGER");
    expect(mgrEntry).toBeDefined();
    // 100.01 * 0.02 = 2.0002 → 2.00
    expect(mgrEntry!.amount).toBe(2);
  });

  // ─── 20. contractTotal exactly equals fairPrice ───────────
  it("treats contractTotal equal to fairPrice as NOT below fair", () => {
    const contractTotal = 10000;
    const fairPrice = 10000;
    const result = calculateCommissionsPreview(
      makeCtx({ contractTotal, fairPrice }),
      DEFAULT_SETTINGS,
      EMPTY_MGMT,
    );
    const salesRep = result.find((e) => e.commissionType === "SALES_REP");
    expect(salesRep).toBeDefined();
    expect(salesRep!.isBelowFair).toBe(false);
    // Self-gen at fair: traditional rate 12%
    expect(salesRep!.rate).toBe(0.12);
  });

  // ─── Additional edge: setter-set flow (not self-gen) ──────
  describe("setter-set flow (not self-gen)", () => {
    it("uses salesRep (not traditional) rates with setter present", () => {
      const result = calculateCommissionsPreview(
        makeCtx({ salesRepId: "rep-1", setterId: "setter-1" }),
        DEFAULT_SETTINGS,
        EMPTY_MGMT,
      );
      const salesRep = result.find((e) => e.commissionType === "SALES_REP");
      const setter = result.find((e) => e.commissionType === "SETTER");
      expect(salesRep).toBeDefined();
      expect(setter).toBeDefined();
      // Not self-gen, at fair price: salesRepRate = 0.10
      expect(salesRep!.rate).toBe(0.10);
      expect(salesRep!.isSelfGen).toBe(false);
      expect(setter!.rate).toBe(0.03);
      expect(setter!.userId).toBe("setter-1");
    });

    it("below floor: setter-set sales rep gets no commission, setter gets none", () => {
      const fairPrice = 10000;
      // Below floor: 10000 * 0.85 - 1 = 8499
      const contractTotal = fairPrice * 0.85 - 1;
      const result = calculateCommissionsPreview(
        makeCtx({ contractTotal, fairPrice, salesRepId: "rep-1", setterId: "setter-1" }),
        DEFAULT_SETTINGS,
        EMPTY_MGMT,
      );
      const salesRep = result.find((e) => e.commissionType === "SALES_REP");
      const setter = result.find((e) => e.commissionType === "SETTER");
      expect(salesRep).toBeUndefined();
      expect(setter).toBeUndefined();
    });
  });

  // ─── Additional edge: below-fair rate selection ───────────
  describe("below-fair rate selection", () => {
    it("uses below-fair rates for VP and NSM when contract is below fair price", () => {
      const fairPrice = 10000;
      const contractTotal = 9000; // below fair, but above floor
      const mgmt = {
        ...EMPTY_MGMT,
        vps: [{ id: "vp-1" }],
        nsms: [{ id: "nsm-1" }],
      };
      const result = calculateCommissionsPreview(
        makeCtx({ contractTotal, fairPrice }),
        DEFAULT_SETTINGS,
        mgmt,
      );
      const vp = result.find((e) => e.commissionType === "VP");
      const nsm = result.find((e) => e.commissionType === "NSM");
      expect(vp!.rate).toBe(0.005); // vpRateBelowFair
      // Self-gen NSM below fair: traditionalNsmOverrideRateBelowFair
      expect(nsm!.rate).toBe(0.0025);
    });

    it("uses setter-manager below-fair rate when contract is below fair price", () => {
      const fairPrice = 10000;
      const contractTotal = 9000;
      const mgmt = {
        ...EMPTY_MGMT,
        setterManagers: [{ id: "mgr-1" }],
      };
      const result = calculateCommissionsPreview(
        makeCtx({ contractTotal, fairPrice }),
        DEFAULT_SETTINGS,
        mgmt,
      );
      const mgr = result.find((e) => e.commissionType === "SETTER_MANAGER");
      expect(mgr!.rate).toBe(0.01); // setterManagerRateBelowFair
    });
  });
});
