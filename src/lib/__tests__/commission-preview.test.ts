import { describe, it, expect } from "vitest";
import {
  calculateCommissionsPreview,
  type CommissionContext,
  type CommissionOverrideMap,
} from "../commission";

// ─── Default settings matching commission.ts DEFAULT_SETTINGS ──────

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

// ─── Helpers ───────────────────────────────────────────────────────

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

function makeCtx(overrides: Partial<CommissionContext> = {}): CommissionContext {
  return {
    contractId: "contract-1",
    contractTotal: 10000,
    fairPrice: 10000,
    salesRepId: "sales-rep-1",
    setterId: "setter-1",
    ...overrides,
  };
}

interface ManagementUsers {
  setterManagers: { id: string }[];
  territoryOwners: { id: string }[];
  vps: { id: string }[];
  nsms: { id: string }[];
  salesRepTerritoryId: string | null;
  cumulativeRevenue: number;
}

function makeMgmt(overrides: Partial<ManagementUsers> = {}): ManagementUsers {
  return {
    setterManagers: [{ id: "mgr-1" }],
    territoryOwners: [{ id: "territory-owner-1" }],
    vps: [{ id: "vp-1" }],
    nsms: [{ id: "nsm-1" }],
    salesRepTerritoryId: "territory-1",
    cumulativeRevenue: 0,
    ...overrides,
  };
}

function findEntry(entries: ReturnType<typeof calculateCommissionsPreview>, type: string, userId?: string) {
  return entries.find(
    (e) => e.commissionType === type && (userId ? e.userId === userId : true)
  );
}

function findAllEntries(entries: ReturnType<typeof calculateCommissionsPreview>, type: string) {
  return entries.filter((e) => e.commissionType === type);
}

// ─── Tests ─────────────────────────────────────────────────────────

describe("calculateCommissionsPreview", () => {
  // 1. Basic setter-set scenario (all 6 commission types)
  describe("basic setter-set scenario", () => {
    it("returns all 6 commission types when all roles present", () => {
      const ctx = makeCtx();
      const mgmt = makeMgmt();
      const entries = calculateCommissionsPreview(ctx, DEFAULT_SETTINGS, mgmt);

      expect(entries).toHaveLength(6);

      const types = entries.map((e) => e.commissionType);
      expect(types).toContain("SALES_REP");
      expect(types).toContain("SETTER");
      expect(types).toContain("SETTER_MANAGER");
      expect(types).toContain("TERRITORY_OWNER");
      expect(types).toContain("VP");
      expect(types).toContain("NSM");
    });

    it("calculates correct amounts at fair price", () => {
      const ctx = makeCtx({ contractTotal: 10000, fairPrice: 10000 });
      const mgmt = makeMgmt();
      const entries = calculateCommissionsPreview(ctx, DEFAULT_SETTINGS, mgmt);

      const salesRep = findEntry(entries, "SALES_REP")!;
      expect(salesRep.rate).toBe(0.10);
      expect(salesRep.amount).toBe(round(10000 * 0.10));
      expect(salesRep.isBelowFair).toBe(false);
      expect(salesRep.isSelfGen).toBe(false);

      const setter = findEntry(entries, "SETTER")!;
      expect(setter.rate).toBe(0.03);
      expect(setter.amount).toBe(round(10000 * 0.03));
      expect(setter.userId).toBe("setter-1");

      const setterMgr = findEntry(entries, "SETTER_MANAGER")!;
      expect(setterMgr.rate).toBe(0.02);
      expect(setterMgr.amount).toBe(round(10000 * 0.02));

      const territory = findEntry(entries, "TERRITORY_OWNER")!;
      expect(territory.rate).toBe(0.01); // tier 1
      expect(territory.amount).toBe(round(10000 * 0.01));
      expect(territory.tierLabel).toBe("Tier 1");

      const vp = findEntry(entries, "VP")!;
      expect(vp.rate).toBe(0.01);
      expect(vp.amount).toBe(round(10000 * 0.01));

      const nsm = findEntry(entries, "NSM")!;
      expect(nsm.rate).toBe(0.005);
      expect(nsm.amount).toBe(round(10000 * 0.005));
    });

    it("marks all entries with correct context fields", () => {
      const ctx = makeCtx({ contractTotal: 10000, fairPrice: 10000 });
      const mgmt = makeMgmt();
      const entries = calculateCommissionsPreview(ctx, DEFAULT_SETTINGS, mgmt);

      for (const entry of entries) {
        expect(entry.contractTotal).toBe(10000);
        expect(entry.fairPrice).toBe(10000);
        expect(entry.isBelowFair).toBe(false);
        expect(entry.isSelfGen).toBe(false);
      }
    });
  });

  // 2. Self-gen scenario
  describe("self-gen scenario", () => {
    it("uses traditional rates and omits setter entry when setterId is null", () => {
      const ctx = makeCtx({ setterId: null });
      const mgmt = makeMgmt();
      const entries = calculateCommissionsPreview(ctx, DEFAULT_SETTINGS, mgmt);

      // No SETTER entry
      expect(findEntry(entries, "SETTER")).toBeUndefined();

      const salesRep = findEntry(entries, "SALES_REP")!;
      expect(salesRep.isSelfGen).toBe(true);
      expect(salesRep.rate).toBe(0.12); // traditionalSalesRepRate
      expect(salesRep.tierLabel).toBe("Traditional");
      expect(salesRep.amount).toBe(round(10000 * 0.12));
    });

    it("uses traditional rates when setterId equals salesRepId", () => {
      const ctx = makeCtx({ setterId: "sales-rep-1" });
      const mgmt = makeMgmt();
      const entries = calculateCommissionsPreview(ctx, DEFAULT_SETTINGS, mgmt);

      expect(findEntry(entries, "SETTER")).toBeUndefined();

      const salesRep = findEntry(entries, "SALES_REP")!;
      expect(salesRep.isSelfGen).toBe(true);
      expect(salesRep.rate).toBe(0.12);
    });

    it("uses traditional NSM rate for self-gen", () => {
      const ctx = makeCtx({ setterId: null });
      const mgmt = makeMgmt();
      const entries = calculateCommissionsPreview(ctx, DEFAULT_SETTINGS, mgmt);

      const nsm = findEntry(entries, "NSM")!;
      expect(nsm.rate).toBe(0.005); // traditionalNsmOverrideRate
      expect(nsm.isSelfGen).toBe(true);
    });
  });

  // 3. Below-fair pricing
  describe("below-fair pricing", () => {
    it("applies reduced rates for all roles when below fair price", () => {
      // contractTotal=9000, fairPrice=10000, ratio=0.9 (above floor 0.85)
      const ctx = makeCtx({ contractTotal: 9000, fairPrice: 10000 });
      const mgmt = makeMgmt();
      const entries = calculateCommissionsPreview(ctx, DEFAULT_SETTINGS, mgmt);

      const salesRep = findEntry(entries, "SALES_REP")!;
      expect(salesRep.isBelowFair).toBe(true);
      expect(salesRep.rate).toBe(0.05); // salesRepRateBelowFair
      expect(salesRep.amount).toBe(round(9000 * 0.05));

      const setter = findEntry(entries, "SETTER")!;
      // setter rate does not have a below-fair variant, uses setterRate
      expect(setter.rate).toBe(0.03);
      expect(setter.amount).toBe(round(9000 * 0.03));

      const setterMgr = findEntry(entries, "SETTER_MANAGER")!;
      expect(setterMgr.rate).toBe(0.01); // setterManagerRateBelowFair

      const vp = findEntry(entries, "VP")!;
      expect(vp.rate).toBe(0.005); // vpRateBelowFair

      const nsm = findEntry(entries, "NSM")!;
      expect(nsm.rate).toBe(0.0025); // nsmRateBelowFair
    });

    it("applies below-fair traditional rates for self-gen below fair", () => {
      const ctx = makeCtx({ contractTotal: 9000, fairPrice: 10000, setterId: null });
      const mgmt = makeMgmt();
      const entries = calculateCommissionsPreview(ctx, DEFAULT_SETTINGS, mgmt);

      const salesRep = findEntry(entries, "SALES_REP")!;
      expect(salesRep.rate).toBe(0.07); // traditionalSalesRepRateBelowFair
      expect(salesRep.isBelowFair).toBe(true);
      expect(salesRep.isSelfGen).toBe(true);
    });
  });

  // 4. Floor enforcement
  describe("floor enforcement", () => {
    it("excludes sales rep entry when contractTotal is below floor", () => {
      // Floor = 85%, so 8400 < 10000 * 0.85 = 8500
      const ctx = makeCtx({ contractTotal: 8400, fairPrice: 10000 });
      const mgmt = makeMgmt();
      const entries = calculateCommissionsPreview(ctx, DEFAULT_SETTINGS, mgmt);

      expect(findEntry(entries, "SALES_REP")).toBeUndefined();
    });

    it("excludes setter entry when contractTotal is below setter floor", () => {
      const ctx = makeCtx({ contractTotal: 8400, fairPrice: 10000 });
      const mgmt = makeMgmt();
      const entries = calculateCommissionsPreview(ctx, DEFAULT_SETTINGS, mgmt);

      expect(findEntry(entries, "SETTER")).toBeUndefined();
    });

    it("still includes management entries when below floor", () => {
      // Management entries (setter_manager, territory_owner, vp, nsm) don't have floor checks
      const ctx = makeCtx({ contractTotal: 8400, fairPrice: 10000 });
      const mgmt = makeMgmt();
      const entries = calculateCommissionsPreview(ctx, DEFAULT_SETTINGS, mgmt);

      expect(findEntry(entries, "SETTER_MANAGER")).toBeDefined();
      expect(findEntry(entries, "TERRITORY_OWNER")).toBeDefined();
      expect(findEntry(entries, "VP")).toBeDefined();
      expect(findEntry(entries, "NSM")).toBeDefined();
    });

    it("includes sales rep at exactly the floor boundary", () => {
      // Exactly at floor: 8500 = 10000 * 0.85
      const ctx = makeCtx({ contractTotal: 8500, fairPrice: 10000 });
      const mgmt = makeMgmt();
      const entries = calculateCommissionsPreview(ctx, DEFAULT_SETTINGS, mgmt);

      expect(findEntry(entries, "SALES_REP")).toBeDefined();
      expect(findEntry(entries, "SETTER")).toBeDefined();
    });

    it("uses traditional floor for self-gen", () => {
      // traditionalFloorRate = 0.85, so 8400 < 10000 * 0.85 = 8500
      const ctx = makeCtx({ contractTotal: 8400, fairPrice: 10000, setterId: null });
      const mgmt = makeMgmt();
      const entries = calculateCommissionsPreview(ctx, DEFAULT_SETTINGS, mgmt);

      expect(findEntry(entries, "SALES_REP")).toBeUndefined();
    });
  });

  // 5. Ceiling cap
  describe("ceiling cap", () => {
    it("caps commissionable revenue at ceiling for sales rep", () => {
      // contractTotal=13000, fairPrice=10000, ceiling=1.15 -> capped at 11500
      const ctx = makeCtx({ contractTotal: 13000, fairPrice: 10000 });
      const mgmt = makeMgmt();
      const entries = calculateCommissionsPreview(ctx, DEFAULT_SETTINGS, mgmt);

      const salesRep = findEntry(entries, "SALES_REP")!;
      expect(salesRep.amount).toBe(round(11500 * 0.10)); // capped revenue * rate
    });

    it("does not cap when contractTotal is below ceiling", () => {
      const ctx = makeCtx({ contractTotal: 10500, fairPrice: 10000 });
      const mgmt = makeMgmt();
      const entries = calculateCommissionsPreview(ctx, DEFAULT_SETTINGS, mgmt);

      const salesRep = findEntry(entries, "SALES_REP")!;
      expect(salesRep.amount).toBe(round(10500 * 0.10)); // no cap
    });

    it("caps at traditional ceiling for self-gen", () => {
      // traditionalPriceCeiling = 1.15, so cap = 10000 * 1.15 = 11500
      const ctx = makeCtx({ contractTotal: 13000, fairPrice: 10000, setterId: null });
      const mgmt = makeMgmt();
      const entries = calculateCommissionsPreview(ctx, DEFAULT_SETTINGS, mgmt);

      const salesRep = findEntry(entries, "SALES_REP")!;
      expect(salesRep.amount).toBe(round(11500 * 0.12));
    });

    it("other roles use contractTotal directly without ceiling cap", () => {
      // Setter, setter_manager, territory_owner, VP, NSM use contractTotal not capped
      const ctx = makeCtx({ contractTotal: 13000, fairPrice: 10000 });
      const mgmt = makeMgmt();
      const entries = calculateCommissionsPreview(ctx, DEFAULT_SETTINGS, mgmt);

      const setter = findEntry(entries, "SETTER")!;
      expect(setter.amount).toBe(round(13000 * 0.03));

      const setterMgr = findEntry(entries, "SETTER_MANAGER")!;
      expect(setterMgr.amount).toBe(round(13000 * 0.02));

      const vp = findEntry(entries, "VP")!;
      expect(vp.amount).toBe(round(13000 * 0.01));
    });
  });

  // 6. Override map
  describe("override map", () => {
    it("applies custom rate for sales rep", () => {
      const ctx = makeCtx();
      const mgmt = makeMgmt();
      const overrides: CommissionOverrideMap = {
        "sales-rep-1:SALES_REP": 0.15,
      };
      const entries = calculateCommissionsPreview(ctx, DEFAULT_SETTINGS, mgmt, overrides);

      const salesRep = findEntry(entries, "SALES_REP")!;
      expect(salesRep.rate).toBe(0.15);
      expect(salesRep.amount).toBe(round(10000 * 0.15));
      expect(salesRep.notes).toBe("Custom rate override");
    });

    it("applies custom rate for setter", () => {
      const ctx = makeCtx();
      const mgmt = makeMgmt();
      const overrides: CommissionOverrideMap = {
        "setter-1:SETTER": 0.05,
      };
      const entries = calculateCommissionsPreview(ctx, DEFAULT_SETTINGS, mgmt, overrides);

      const setter = findEntry(entries, "SETTER")!;
      expect(setter.rate).toBe(0.05);
      expect(setter.amount).toBe(round(10000 * 0.05));
      expect(setter.notes).toBe("Custom rate override");
    });

    it("applies custom rate for VP", () => {
      const ctx = makeCtx();
      const mgmt = makeMgmt();
      const overrides: CommissionOverrideMap = {
        "vp-1:VP": 0.025,
      };
      const entries = calculateCommissionsPreview(ctx, DEFAULT_SETTINGS, mgmt, overrides);

      const vp = findEntry(entries, "VP")!;
      expect(vp.rate).toBe(0.025);
      expect(vp.amount).toBe(round(10000 * 0.025));
    });

    it("applies overrides to multiple roles simultaneously", () => {
      const ctx = makeCtx();
      const mgmt = makeMgmt();
      const overrides: CommissionOverrideMap = {
        "sales-rep-1:SALES_REP": 0.20,
        "setter-1:SETTER": 0.06,
        "mgr-1:SETTER_MANAGER": 0.04,
      };
      const entries = calculateCommissionsPreview(ctx, DEFAULT_SETTINGS, mgmt, overrides);

      expect(findEntry(entries, "SALES_REP")!.rate).toBe(0.20);
      expect(findEntry(entries, "SETTER")!.rate).toBe(0.06);
      expect(findEntry(entries, "SETTER_MANAGER")!.rate).toBe(0.04);
    });

    it("override of 0 results in zero commission", () => {
      const ctx = makeCtx();
      const mgmt = makeMgmt();
      const overrides: CommissionOverrideMap = {
        "sales-rep-1:SALES_REP": 0,
      };
      const entries = calculateCommissionsPreview(ctx, DEFAULT_SETTINGS, mgmt, overrides);

      const salesRep = findEntry(entries, "SALES_REP")!;
      expect(salesRep.rate).toBe(0);
      expect(salesRep.amount).toBe(0);
      expect(salesRep.notes).toBe("Custom rate override");
    });
  });

  // 7. Multiple users in same role
  describe("multiple users in same role", () => {
    it("creates separate entries for 2 VPs", () => {
      const ctx = makeCtx();
      const mgmt = makeMgmt({
        vps: [{ id: "vp-1" }, { id: "vp-2" }],
      });
      const entries = calculateCommissionsPreview(ctx, DEFAULT_SETTINGS, mgmt);

      const vpEntries = findAllEntries(entries, "VP");
      expect(vpEntries).toHaveLength(2);
      expect(vpEntries[0].userId).toBe("vp-1");
      expect(vpEntries[1].userId).toBe("vp-2");
      expect(vpEntries[0].amount).toBe(round(10000 * 0.01));
      expect(vpEntries[1].amount).toBe(round(10000 * 0.01));
    });

    it("creates separate entries for multiple NSMs", () => {
      const ctx = makeCtx();
      const mgmt = makeMgmt({
        nsms: [{ id: "nsm-1" }, { id: "nsm-2" }, { id: "nsm-3" }],
      });
      const entries = calculateCommissionsPreview(ctx, DEFAULT_SETTINGS, mgmt);

      const nsmEntries = findAllEntries(entries, "NSM");
      expect(nsmEntries).toHaveLength(3);
    });

    it("creates separate entries for multiple territory owners", () => {
      const ctx = makeCtx();
      const mgmt = makeMgmt({
        territoryOwners: [{ id: "to-1" }, { id: "to-2" }],
      });
      const entries = calculateCommissionsPreview(ctx, DEFAULT_SETTINGS, mgmt);

      const toEntries = findAllEntries(entries, "TERRITORY_OWNER");
      expect(toEntries).toHaveLength(2);
      expect(toEntries[0].userId).toBe("to-1");
      expect(toEntries[1].userId).toBe("to-2");
    });

    it("creates separate entries for multiple setter managers", () => {
      const ctx = makeCtx();
      const mgmt = makeMgmt({
        setterManagers: [{ id: "mgr-1" }, { id: "mgr-2" }],
      });
      const entries = calculateCommissionsPreview(ctx, DEFAULT_SETTINGS, mgmt);

      const mgrEntries = findAllEntries(entries, "SETTER_MANAGER");
      expect(mgrEntries).toHaveLength(2);
    });

    it("applies override only to targeted user in multi-user role", () => {
      const ctx = makeCtx();
      const mgmt = makeMgmt({
        vps: [{ id: "vp-1" }, { id: "vp-2" }],
      });
      const overrides: CommissionOverrideMap = {
        "vp-1:VP": 0.03,
      };
      const entries = calculateCommissionsPreview(ctx, DEFAULT_SETTINGS, mgmt, overrides);

      const vpEntries = findAllEntries(entries, "VP");
      expect(vpEntries[0].rate).toBe(0.03);
      expect(vpEntries[0].notes).toBe("Custom rate override");
      expect(vpEntries[1].rate).toBe(0.01); // default rate
      expect(vpEntries[1].notes).toBeUndefined();
    });
  });

  // 8. Empty management users
  describe("empty management users", () => {
    it("returns only sales rep and setter entries when no managers", () => {
      const ctx = makeCtx();
      const mgmt = makeMgmt({
        setterManagers: [],
        territoryOwners: [],
        vps: [],
        nsms: [],
        salesRepTerritoryId: null,
      });
      const entries = calculateCommissionsPreview(ctx, DEFAULT_SETTINGS, mgmt);

      expect(entries).toHaveLength(2);
      expect(findEntry(entries, "SALES_REP")).toBeDefined();
      expect(findEntry(entries, "SETTER")).toBeDefined();
    });

    it("returns only sales rep entry for self-gen with no managers", () => {
      const ctx = makeCtx({ setterId: null });
      const mgmt = makeMgmt({
        setterManagers: [],
        territoryOwners: [],
        vps: [],
        nsms: [],
        salesRepTerritoryId: null,
      });
      const entries = calculateCommissionsPreview(ctx, DEFAULT_SETTINGS, mgmt);

      expect(entries).toHaveLength(1);
      expect(entries[0].commissionType).toBe("SALES_REP");
      expect(entries[0].isSelfGen).toBe(true);
    });

    it("returns empty array when contractTotal is 0", () => {
      const ctx = makeCtx({ contractTotal: 0 });
      const mgmt = makeMgmt();
      const entries = calculateCommissionsPreview(ctx, DEFAULT_SETTINGS, mgmt);

      expect(entries).toHaveLength(0);
    });

    it("returns empty array when contractTotal is negative", () => {
      const ctx = makeCtx({ contractTotal: -500 });
      const mgmt = makeMgmt();
      const entries = calculateCommissionsPreview(ctx, DEFAULT_SETTINGS, mgmt);

      expect(entries).toHaveLength(0);
    });

    it("returns empty array when salesRepId is empty string", () => {
      const ctx = makeCtx({ salesRepId: "" });
      const mgmt = makeMgmt();
      const entries = calculateCommissionsPreview(ctx, DEFAULT_SETTINGS, mgmt);

      expect(entries).toHaveLength(0);
    });
  });

  // 9. Territory owner tiers
  describe("territory owner tiers", () => {
    it("uses tier 1 rate when cumulative revenue is below tier 2 threshold", () => {
      const ctx = makeCtx();
      const mgmt = makeMgmt({ cumulativeRevenue: 200000 });
      const entries = calculateCommissionsPreview(ctx, DEFAULT_SETTINGS, mgmt);

      const to = findEntry(entries, "TERRITORY_OWNER")!;
      expect(to.rate).toBe(0.01);
      expect(to.tierLabel).toBe("Tier 1");
      expect(to.amount).toBe(round(10000 * 0.01));
    });

    it("uses tier 2 rate when cumulative revenue meets tier 2 threshold", () => {
      const ctx = makeCtx();
      const mgmt = makeMgmt({ cumulativeRevenue: 500000 });
      const entries = calculateCommissionsPreview(ctx, DEFAULT_SETTINGS, mgmt);

      const to = findEntry(entries, "TERRITORY_OWNER")!;
      expect(to.rate).toBe(0.015);
      expect(to.tierLabel).toBe("Tier 2");
      expect(to.amount).toBe(round(10000 * 0.015));
    });

    it("uses tier 2 rate when cumulative revenue is between tier 2 and tier 3", () => {
      const ctx = makeCtx();
      const mgmt = makeMgmt({ cumulativeRevenue: 750000 });
      const entries = calculateCommissionsPreview(ctx, DEFAULT_SETTINGS, mgmt);

      const to = findEntry(entries, "TERRITORY_OWNER")!;
      expect(to.rate).toBe(0.015);
      expect(to.tierLabel).toBe("Tier 2");
    });

    it("uses tier 3 rate when cumulative revenue meets tier 3 threshold", () => {
      const ctx = makeCtx();
      const mgmt = makeMgmt({ cumulativeRevenue: 1000000 });
      const entries = calculateCommissionsPreview(ctx, DEFAULT_SETTINGS, mgmt);

      const to = findEntry(entries, "TERRITORY_OWNER")!;
      expect(to.rate).toBe(0.02);
      expect(to.tierLabel).toBe("Tier 3");
      expect(to.amount).toBe(round(10000 * 0.02));
    });

    it("uses tier 3 rate when cumulative revenue exceeds tier 3 threshold", () => {
      const ctx = makeCtx();
      const mgmt = makeMgmt({ cumulativeRevenue: 2000000 });
      const entries = calculateCommissionsPreview(ctx, DEFAULT_SETTINGS, mgmt);

      const to = findEntry(entries, "TERRITORY_OWNER")!;
      expect(to.rate).toBe(0.02);
      expect(to.tierLabel).toBe("Tier 3");
    });

    it("skips territory owner when salesRepTerritoryId is null", () => {
      const ctx = makeCtx();
      const mgmt = makeMgmt({
        salesRepTerritoryId: null,
        territoryOwners: [{ id: "to-1" }],
        cumulativeRevenue: 1000000,
      });
      const entries = calculateCommissionsPreview(ctx, DEFAULT_SETTINGS, mgmt);

      expect(findEntry(entries, "TERRITORY_OWNER")).toBeUndefined();
    });

    it("skips territory owner when territoryOwners array is empty", () => {
      const ctx = makeCtx();
      const mgmt = makeMgmt({
        salesRepTerritoryId: "territory-1",
        territoryOwners: [],
      });
      const entries = calculateCommissionsPreview(ctx, DEFAULT_SETTINGS, mgmt);

      expect(findEntry(entries, "TERRITORY_OWNER")).toBeUndefined();
    });
  });

  // 10. Combinations
  describe("combinations", () => {
    it("self-gen + below-fair uses traditional below-fair rates", () => {
      const ctx = makeCtx({ contractTotal: 9000, fairPrice: 10000, setterId: null });
      const mgmt = makeMgmt();
      const entries = calculateCommissionsPreview(ctx, DEFAULT_SETTINGS, mgmt);

      const salesRep = findEntry(entries, "SALES_REP")!;
      expect(salesRep.isSelfGen).toBe(true);
      expect(salesRep.isBelowFair).toBe(true);
      expect(salesRep.rate).toBe(0.07); // traditionalSalesRepRateBelowFair
      expect(salesRep.tierLabel).toBe("Traditional");

      const nsm = findEntry(entries, "NSM")!;
      expect(nsm.rate).toBe(0.0025); // traditionalNsmOverrideRateBelowFair
      expect(nsm.isSelfGen).toBe(true);
      expect(nsm.isBelowFair).toBe(true);

      // No setter entry
      expect(findEntry(entries, "SETTER")).toBeUndefined();
    });

    it("below-fair + override uses override rate even when below fair", () => {
      const ctx = makeCtx({ contractTotal: 9000, fairPrice: 10000 });
      const mgmt = makeMgmt();
      const overrides: CommissionOverrideMap = {
        "sales-rep-1:SALES_REP": 0.08,
      };
      const entries = calculateCommissionsPreview(ctx, DEFAULT_SETTINGS, mgmt, overrides);

      const salesRep = findEntry(entries, "SALES_REP")!;
      expect(salesRep.isBelowFair).toBe(true);
      expect(salesRep.rate).toBe(0.08); // override, not 0.05
      expect(salesRep.amount).toBe(round(9000 * 0.08));
      expect(salesRep.notes).toBe("Custom rate override");
    });

    it("self-gen + below-fair + below floor = no sales rep entry", () => {
      // traditionalFloorRate = 0.85, so 8400 < 10000 * 0.85 = 8500
      const ctx = makeCtx({ contractTotal: 8400, fairPrice: 10000, setterId: null });
      const mgmt = makeMgmt();
      const entries = calculateCommissionsPreview(ctx, DEFAULT_SETTINGS, mgmt);

      expect(findEntry(entries, "SALES_REP")).toBeUndefined();
      // Management roles still present
      expect(findEntry(entries, "SETTER_MANAGER")).toBeDefined();
      expect(findEntry(entries, "VP")).toBeDefined();
    });

    it("ceiling + below-fair: sales rep uses below-fair rate on capped revenue", () => {
      // contractTotal=13000, fairPrice=12000 -> below fair? no (13000 > 12000)
      // Let's try: contractTotal=11000, fairPrice=12000 -> belowFair=true
      // ceiling = 1.15, cap = 12000 * 1.15 = 13800, so 11000 < 13800, no cap
      const ctx = makeCtx({ contractTotal: 11000, fairPrice: 12000 });
      const mgmt = makeMgmt();
      const entries = calculateCommissionsPreview(ctx, DEFAULT_SETTINGS, mgmt);

      const salesRep = findEntry(entries, "SALES_REP")!;
      expect(salesRep.isBelowFair).toBe(true);
      expect(salesRep.rate).toBe(0.05);
      expect(salesRep.amount).toBe(round(11000 * 0.05));
    });

    it("multiple VPs + below-fair: all VPs get below-fair rate", () => {
      const ctx = makeCtx({ contractTotal: 9000, fairPrice: 10000 });
      const mgmt = makeMgmt({
        vps: [{ id: "vp-1" }, { id: "vp-2" }],
      });
      const entries = calculateCommissionsPreview(ctx, DEFAULT_SETTINGS, mgmt);

      const vpEntries = findAllEntries(entries, "VP");
      expect(vpEntries).toHaveLength(2);
      for (const vp of vpEntries) {
        expect(vp.rate).toBe(0.005);
        expect(vp.isBelowFair).toBe(true);
        expect(vp.amount).toBe(round(9000 * 0.005));
      }
    });

    it("self-gen + ceiling cap applies traditional ceiling", () => {
      const ctx = makeCtx({ contractTotal: 15000, fairPrice: 10000, setterId: null });
      const mgmt = makeMgmt();
      const entries = calculateCommissionsPreview(ctx, DEFAULT_SETTINGS, mgmt);

      const salesRep = findEntry(entries, "SALES_REP")!;
      // traditionalPriceCeiling = 1.15, cap = 10000 * 1.15 = 11500
      expect(salesRep.amount).toBe(round(11500 * 0.12));
      expect(salesRep.isSelfGen).toBe(true);
    });

    it("territory owner override overrides tier rate", () => {
      const ctx = makeCtx();
      const mgmt = makeMgmt({ cumulativeRevenue: 1000000 }); // tier 3
      const overrides: CommissionOverrideMap = {
        "territory-owner-1:TERRITORY_OWNER": 0.05,
      };
      const entries = calculateCommissionsPreview(ctx, DEFAULT_SETTINGS, mgmt, overrides);

      const to = findEntry(entries, "TERRITORY_OWNER")!;
      expect(to.rate).toBe(0.05); // override, not 0.02 tier 3
      expect(to.tierLabel).toBe("Tier 3"); // tier label still set
      expect(to.notes).toBe("Custom rate override");
    });
  });
});
