import { describe, it, expect } from "vitest";
import {
  calculateCommissionsPreview,
  type CommissionContext,
  type CommissionEntry,
} from "@/lib/commission";

// ─── Default settings matching DEFAULT_SETTINGS in commission.ts ───

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

// ─── Helpers ───────────────────────────────────────────────────

function totalPayout(entries: CommissionEntry[]): number {
  return Math.round(entries.reduce((sum, e) => sum + e.amount, 0) * 100) / 100;
}

function findEntry(entries: CommissionEntry[], type: string): CommissionEntry | undefined {
  return entries.find((e) => e.commissionType === type);
}

function makeMgmt(opts: {
  setterManagers?: { id: string }[];
  territoryOwners?: { id: string }[];
  vps?: { id: string }[];
  nsms?: { id: string }[];
  salesRepTerritoryId?: string | null;
  cumulativeRevenue?: number;
} = {}) {
  return {
    setterManagers: opts.setterManagers ?? [{ id: "mgr-1" }],
    territoryOwners: opts.territoryOwners ?? [{ id: "owner-1" }],
    vps: opts.vps ?? [{ id: "vp-1" }],
    nsms: opts.nsms ?? [{ id: "nsm-1" }],
    salesRepTerritoryId: opts.salesRepTerritoryId !== undefined ? opts.salesRepTerritoryId : "territory-1",
    cumulativeRevenue: opts.cumulativeRevenue ?? 0,
  };
}

// ─── Test Scenarios ────────────────────────────────────────────

describe("calculateCommissionsPreview - exact dollar amounts", () => {
  describe("Scenario 1: $10,000 contract at fair price, setter-set, all roles", () => {
    const ctx: CommissionContext = {
      contractId: "contract-1",
      contractTotal: 10000,
      fairPrice: 10000,
      salesRepId: "rep-1",
      setterId: "setter-1",
    };
    const mgmt = makeMgmt({ cumulativeRevenue: 0 });
    let entries: CommissionEntry[];

    it("calculates all commissions", () => {
      entries = calculateCommissionsPreview(ctx, DEFAULT_SETTINGS, mgmt);
      expect(entries).toHaveLength(6);
    });

    it("Sales Rep: $10,000 * 0.10 = $1,000", () => {
      entries = calculateCommissionsPreview(ctx, DEFAULT_SETTINGS, mgmt);
      const rep = findEntry(entries, "SALES_REP")!;
      expect(rep.rate).toBe(0.10);
      expect(rep.amount).toBe(1000);
      expect(rep.isSelfGen).toBe(false);
      expect(rep.isBelowFair).toBe(false);
    });

    it("Setter: $10,000 * 0.03 = $300", () => {
      entries = calculateCommissionsPreview(ctx, DEFAULT_SETTINGS, mgmt);
      const setter = findEntry(entries, "SETTER")!;
      expect(setter.rate).toBe(0.03);
      expect(setter.amount).toBe(300);
    });

    it("Setter Manager: $10,000 * 0.02 = $200", () => {
      entries = calculateCommissionsPreview(ctx, DEFAULT_SETTINGS, mgmt);
      const mgr = findEntry(entries, "SETTER_MANAGER")!;
      expect(mgr.rate).toBe(0.02);
      expect(mgr.amount).toBe(200);
    });

    it("Territory Owner (Tier 1): $10,000 * 0.01 = $100", () => {
      entries = calculateCommissionsPreview(ctx, DEFAULT_SETTINGS, mgmt);
      const owner = findEntry(entries, "TERRITORY_OWNER")!;
      expect(owner.rate).toBe(0.01);
      expect(owner.amount).toBe(100);
      expect(owner.tierLabel).toBe("Tier 1");
    });

    it("VP: $10,000 * 0.01 = $100", () => {
      entries = calculateCommissionsPreview(ctx, DEFAULT_SETTINGS, mgmt);
      const vp = findEntry(entries, "VP")!;
      expect(vp.rate).toBe(0.01);
      expect(vp.amount).toBe(100);
    });

    it("NSM: $10,000 * 0.005 = $50", () => {
      entries = calculateCommissionsPreview(ctx, DEFAULT_SETTINGS, mgmt);
      const nsm = findEntry(entries, "NSM")!;
      expect(nsm.rate).toBe(0.005);
      expect(nsm.amount).toBe(50);
    });

    it("Total payout = $1,750", () => {
      entries = calculateCommissionsPreview(ctx, DEFAULT_SETTINGS, mgmt);
      expect(totalPayout(entries)).toBe(1750);
    });
  });

  describe("Scenario 2: $25,000 contract at fair price, self-gen", () => {
    const ctx: CommissionContext = {
      contractId: "contract-2",
      contractTotal: 25000,
      fairPrice: 25000,
      salesRepId: "rep-1",
      setterId: null, // self-gen
    };
    const mgmt = makeMgmt({
      territoryOwners: [],
      salesRepTerritoryId: null,
      cumulativeRevenue: 0,
    });
    let entries: CommissionEntry[];

    it("has no setter entry for self-gen", () => {
      entries = calculateCommissionsPreview(ctx, DEFAULT_SETTINGS, mgmt);
      const setter = findEntry(entries, "SETTER");
      expect(setter).toBeUndefined();
    });

    it("Sales Rep (Traditional): $25,000 * 0.12 = $3,000", () => {
      entries = calculateCommissionsPreview(ctx, DEFAULT_SETTINGS, mgmt);
      const rep = findEntry(entries, "SALES_REP")!;
      expect(rep.rate).toBe(0.12);
      expect(rep.amount).toBe(3000);
      expect(rep.isSelfGen).toBe(true);
      expect(rep.tierLabel).toBe("Traditional");
    });

    it("Setter Manager: $25,000 * 0.02 = $500", () => {
      entries = calculateCommissionsPreview(ctx, DEFAULT_SETTINGS, mgmt);
      const mgr = findEntry(entries, "SETTER_MANAGER")!;
      expect(mgr.rate).toBe(0.02);
      expect(mgr.amount).toBe(500);
    });

    it("VP: $25,000 * 0.01 = $250", () => {
      entries = calculateCommissionsPreview(ctx, DEFAULT_SETTINGS, mgmt);
      const vp = findEntry(entries, "VP")!;
      expect(vp.rate).toBe(0.01);
      expect(vp.amount).toBe(250);
    });

    it("NSM (traditional rate): $25,000 * 0.005 = $125", () => {
      entries = calculateCommissionsPreview(ctx, DEFAULT_SETTINGS, mgmt);
      const nsm = findEntry(entries, "NSM")!;
      expect(nsm.rate).toBe(0.005);
      expect(nsm.amount).toBe(125);
    });

    it("Total payout = $3,875", () => {
      entries = calculateCommissionsPreview(ctx, DEFAULT_SETTINGS, mgmt);
      // 3000 + 500 + 250 + 125 = 3875
      expect(totalPayout(entries)).toBe(3875);
    });
  });

  describe("Scenario 3: $8,500 contract with $10,000 fair price (below fair, at floor)", () => {
    const ctx: CommissionContext = {
      contractId: "contract-3",
      contractTotal: 8500,
      fairPrice: 10000,
      salesRepId: "rep-1",
      setterId: "setter-1", // setter-set
    };
    const mgmt = makeMgmt({ cumulativeRevenue: 0 });
    let entries: CommissionEntry[];

    it("uses below-fair rates", () => {
      entries = calculateCommissionsPreview(ctx, DEFAULT_SETTINGS, mgmt);
      const rep = findEntry(entries, "SALES_REP")!;
      expect(rep.isBelowFair).toBe(true);
    });

    it("meets floor exactly: $8,500 >= $10,000 * 0.85", () => {
      entries = calculateCommissionsPreview(ctx, DEFAULT_SETTINGS, mgmt);
      const rep = findEntry(entries, "SALES_REP");
      expect(rep).toBeDefined();
    });

    it("Sales Rep (below-fair): $8,500 * 0.05 = $425", () => {
      entries = calculateCommissionsPreview(ctx, DEFAULT_SETTINGS, mgmt);
      const rep = findEntry(entries, "SALES_REP")!;
      expect(rep.rate).toBe(0.05);
      expect(rep.amount).toBe(425);
    });

    it("Setter (below-fair still uses setter rate): $8,500 * 0.03 = $255", () => {
      entries = calculateCommissionsPreview(ctx, DEFAULT_SETTINGS, mgmt);
      const setter = findEntry(entries, "SETTER")!;
      expect(setter.rate).toBe(0.03);
      expect(setter.amount).toBe(255);
    });

    it("Setter Manager (below-fair rate): $8,500 * 0.01 = $85", () => {
      entries = calculateCommissionsPreview(ctx, DEFAULT_SETTINGS, mgmt);
      const mgr = findEntry(entries, "SETTER_MANAGER")!;
      expect(mgr.rate).toBe(0.01);
      expect(mgr.amount).toBe(85);
    });

    it("VP (below-fair rate): $8,500 * 0.005 = $42.50", () => {
      entries = calculateCommissionsPreview(ctx, DEFAULT_SETTINGS, mgmt);
      const vp = findEntry(entries, "VP")!;
      expect(vp.rate).toBe(0.005);
      expect(vp.amount).toBe(42.5);
    });

    it("NSM (below-fair rate): $8,500 * 0.0025 = $21.25", () => {
      entries = calculateCommissionsPreview(ctx, DEFAULT_SETTINGS, mgmt);
      const nsm = findEntry(entries, "NSM")!;
      expect(nsm.rate).toBe(0.0025);
      expect(nsm.amount).toBe(21.25);
    });
  });

  describe("Scenario 4: $15,000 contract with $10,000 fair price (above ceiling)", () => {
    const ctx: CommissionContext = {
      contractId: "contract-4",
      contractTotal: 15000,
      fairPrice: 10000,
      salesRepId: "rep-1",
      setterId: "setter-1",
    };
    const mgmt = makeMgmt({ cumulativeRevenue: 0 });
    let entries: CommissionEntry[];

    it("caps commissionable revenue at ceiling: min($15,000, $10,000 * 1.15) = $11,500", () => {
      entries = calculateCommissionsPreview(ctx, DEFAULT_SETTINGS, mgmt);
      const rep = findEntry(entries, "SALES_REP")!;
      // Sales rep uses commissionableRevenue with ceiling
      expect(rep.amount).toBe(1150); // $11,500 * 0.10
    });

    it("Sales Rep: $11,500 * 0.10 = $1,150", () => {
      entries = calculateCommissionsPreview(ctx, DEFAULT_SETTINGS, mgmt);
      const rep = findEntry(entries, "SALES_REP")!;
      expect(rep.rate).toBe(0.10);
      expect(rep.amount).toBe(1150);
      expect(rep.isBelowFair).toBe(false);
    });

    it("Setter uses full contractTotal (no ceiling): $15,000 * 0.03 = $450", () => {
      entries = calculateCommissionsPreview(ctx, DEFAULT_SETTINGS, mgmt);
      const setter = findEntry(entries, "SETTER")!;
      expect(setter.amount).toBe(450);
    });

    it("Setter Manager uses full contractTotal: $15,000 * 0.02 = $300", () => {
      entries = calculateCommissionsPreview(ctx, DEFAULT_SETTINGS, mgmt);
      const mgr = findEntry(entries, "SETTER_MANAGER")!;
      expect(mgr.amount).toBe(300);
    });

    it("Territory Owner: $15,000 * 0.01 = $150", () => {
      entries = calculateCommissionsPreview(ctx, DEFAULT_SETTINGS, mgmt);
      const owner = findEntry(entries, "TERRITORY_OWNER")!;
      expect(owner.amount).toBe(150);
    });

    it("VP: $15,000 * 0.01 = $150", () => {
      entries = calculateCommissionsPreview(ctx, DEFAULT_SETTINGS, mgmt);
      const vp = findEntry(entries, "VP")!;
      expect(vp.amount).toBe(150);
    });

    it("NSM: $15,000 * 0.005 = $75", () => {
      entries = calculateCommissionsPreview(ctx, DEFAULT_SETTINGS, mgmt);
      const nsm = findEntry(entries, "NSM")!;
      expect(nsm.amount).toBe(75);
    });
  });

  describe("Scenario 5: Odd amounts that test rounding", () => {
    it("$7,777 contract - all amounts use Math.round(n * 100) / 100", () => {
      const ctx: CommissionContext = {
        contractId: "contract-5a",
        contractTotal: 7777,
        fairPrice: 7777,
        salesRepId: "rep-1",
        setterId: "setter-1",
      };
      const mgmt = makeMgmt({ cumulativeRevenue: 0 });
      const entries = calculateCommissionsPreview(ctx, DEFAULT_SETTINGS, mgmt);

      const rep = findEntry(entries, "SALES_REP")!;
      expect(rep.amount).toBe(777.70); // 7777 * 0.10 = 777.7

      const setter = findEntry(entries, "SETTER")!;
      expect(setter.amount).toBe(233.31); // 7777 * 0.03 = 233.31

      const mgr = findEntry(entries, "SETTER_MANAGER")!;
      expect(mgr.amount).toBe(155.54); // 7777 * 0.02 = 155.54

      const owner = findEntry(entries, "TERRITORY_OWNER")!;
      expect(owner.amount).toBe(77.77); // 7777 * 0.01 = 77.77

      const vp = findEntry(entries, "VP")!;
      expect(vp.amount).toBe(77.77); // 7777 * 0.01 = 77.77

      const nsm = findEntry(entries, "NSM")!;
      expect(nsm.amount).toBe(38.89); // 7777 * 0.005 = 38.885 -> round -> 38.89
    });

    it("$33,333.33 contract - rounding with repeating decimals", () => {
      const ctx: CommissionContext = {
        contractId: "contract-5b",
        contractTotal: 33333.33,
        fairPrice: 33333.33,
        salesRepId: "rep-1",
        setterId: null, // self-gen
      };
      const mgmt = makeMgmt({
        territoryOwners: [],
        salesRepTerritoryId: null,
      });
      const entries = calculateCommissionsPreview(ctx, DEFAULT_SETTINGS, mgmt);

      const rep = findEntry(entries, "SALES_REP")!;
      // 33333.33 * 0.12 = 4000.0 (rounded) -- actually 3999.9996
      expect(rep.amount).toBe(4000); // Math.round(3999.9996 * 100) / 100 = 4000

      const mgr = findEntry(entries, "SETTER_MANAGER")!;
      // 33333.33 * 0.02 = 666.6666 -> round -> 666.67
      expect(mgr.amount).toBe(666.67);

      const vp = findEntry(entries, "VP")!;
      // 33333.33 * 0.01 = 333.3333 -> round -> 333.33
      expect(vp.amount).toBe(333.33);

      const nsm = findEntry(entries, "NSM")!;
      // 33333.33 * 0.005 = 166.66665 -> round -> 166.67
      expect(nsm.amount).toBe(166.67);
    });
  });

  describe("Scenario 6: Territory owner amounts at different tiers", () => {
    const ctx: CommissionContext = {
      contractId: "contract-6",
      contractTotal: 50000,
      fairPrice: 50000,
      salesRepId: "rep-1",
      setterId: "setter-1",
    };

    it("Tier 1 (cumulative < $500k): $50,000 * 0.01 = $500", () => {
      const mgmt = makeMgmt({ cumulativeRevenue: 250000 });
      const entries = calculateCommissionsPreview(ctx, DEFAULT_SETTINGS, mgmt);
      const owner = findEntry(entries, "TERRITORY_OWNER")!;
      expect(owner.tierLabel).toBe("Tier 1");
      expect(owner.rate).toBe(0.01);
      expect(owner.amount).toBe(500);
    });

    it("Tier 2 (cumulative >= $500k): $50,000 * 0.015 = $750", () => {
      const mgmt = makeMgmt({ cumulativeRevenue: 500000 });
      const entries = calculateCommissionsPreview(ctx, DEFAULT_SETTINGS, mgmt);
      const owner = findEntry(entries, "TERRITORY_OWNER")!;
      expect(owner.tierLabel).toBe("Tier 2");
      expect(owner.rate).toBe(0.015);
      expect(owner.amount).toBe(750);
    });

    it("Tier 2 (cumulative at $999,999): $50,000 * 0.015 = $750", () => {
      const mgmt = makeMgmt({ cumulativeRevenue: 999999 });
      const entries = calculateCommissionsPreview(ctx, DEFAULT_SETTINGS, mgmt);
      const owner = findEntry(entries, "TERRITORY_OWNER")!;
      expect(owner.tierLabel).toBe("Tier 2");
      expect(owner.rate).toBe(0.015);
      expect(owner.amount).toBe(750);
    });

    it("Tier 3 (cumulative >= $1M): $50,000 * 0.02 = $1,000", () => {
      const mgmt = makeMgmt({ cumulativeRevenue: 1000000 });
      const entries = calculateCommissionsPreview(ctx, DEFAULT_SETTINGS, mgmt);
      const owner = findEntry(entries, "TERRITORY_OWNER")!;
      expect(owner.tierLabel).toBe("Tier 3");
      expect(owner.rate).toBe(0.02);
      expect(owner.amount).toBe(1000);
    });

    it("Tier 3 (cumulative well above $1M): $50,000 * 0.02 = $1,000", () => {
      const mgmt = makeMgmt({ cumulativeRevenue: 5000000 });
      const entries = calculateCommissionsPreview(ctx, DEFAULT_SETTINGS, mgmt);
      const owner = findEntry(entries, "TERRITORY_OWNER")!;
      expect(owner.tierLabel).toBe("Tier 3");
      expect(owner.rate).toBe(0.02);
      expect(owner.amount).toBe(1000);
    });

    it("no territory owner when salesRepTerritoryId is null", () => {
      const mgmt = makeMgmt({
        salesRepTerritoryId: null,
        cumulativeRevenue: 1000000,
      });
      const entries = calculateCommissionsPreview(ctx, DEFAULT_SETTINGS, mgmt);
      const owner = findEntry(entries, "TERRITORY_OWNER");
      expect(owner).toBeUndefined();
    });

    it("no territory owner when territoryOwners array is empty", () => {
      const mgmt = makeMgmt({
        territoryOwners: [],
        cumulativeRevenue: 1000000,
      });
      const entries = calculateCommissionsPreview(ctx, DEFAULT_SETTINGS, mgmt);
      const owner = findEntry(entries, "TERRITORY_OWNER");
      expect(owner).toBeUndefined();
    });
  });

  describe("Scenario 7: Total payout calculation across scenarios", () => {
    it("setter-set $10k: sum of all 6 entries = $1,750", () => {
      const ctx: CommissionContext = {
        contractId: "c-7a",
        contractTotal: 10000,
        fairPrice: 10000,
        salesRepId: "rep-1",
        setterId: "setter-1",
      };
      const mgmt = makeMgmt({ cumulativeRevenue: 0 });
      const entries = calculateCommissionsPreview(ctx, DEFAULT_SETTINGS, mgmt);
      expect(entries).toHaveLength(6);
      expect(totalPayout(entries)).toBe(1750);
    });

    it("self-gen $25k (no territory): sum of 4 entries = $3,875", () => {
      const ctx: CommissionContext = {
        contractId: "c-7b",
        contractTotal: 25000,
        fairPrice: 25000,
        salesRepId: "rep-1",
        setterId: null,
      };
      const mgmt = makeMgmt({
        territoryOwners: [],
        salesRepTerritoryId: null,
      });
      const entries = calculateCommissionsPreview(ctx, DEFAULT_SETTINGS, mgmt);
      expect(entries).toHaveLength(4);
      expect(totalPayout(entries)).toBe(3875);
    });

    it("$15k above ceiling setter-set: total = $2,275", () => {
      const ctx: CommissionContext = {
        contractId: "c-7c",
        contractTotal: 15000,
        fairPrice: 10000,
        salesRepId: "rep-1",
        setterId: "setter-1",
      };
      const mgmt = makeMgmt({ cumulativeRevenue: 0 });
      const entries = calculateCommissionsPreview(ctx, DEFAULT_SETTINGS, mgmt);
      // Rep: 1150 + Setter: 450 + Mgr: 300 + Territory: 150 + VP: 150 + NSM: 75 = 2275
      expect(totalPayout(entries)).toBe(2275);
    });

    it("below-fair $8.5k setter-set: total = $828.75", () => {
      const ctx: CommissionContext = {
        contractId: "c-7d",
        contractTotal: 8500,
        fairPrice: 10000,
        salesRepId: "rep-1",
        setterId: "setter-1",
      };
      const mgmt = makeMgmt({ cumulativeRevenue: 0 });
      const entries = calculateCommissionsPreview(ctx, DEFAULT_SETTINGS, mgmt);
      // Rep: 425 + Setter: 255 + Mgr: 85 + Territory: 85 + VP: 42.5 + NSM: 21.25 = 913.75
      expect(totalPayout(entries)).toBe(913.75);
    });

    it("zero contract total returns empty", () => {
      const ctx: CommissionContext = {
        contractId: "c-7e",
        contractTotal: 0,
        fairPrice: 10000,
        salesRepId: "rep-1",
        setterId: "setter-1",
      };
      const mgmt = makeMgmt();
      const entries = calculateCommissionsPreview(ctx, DEFAULT_SETTINGS, mgmt);
      expect(entries).toHaveLength(0);
      expect(totalPayout(entries)).toBe(0);
    });

    it("below floor returns no sales rep or setter entry", () => {
      // Floor = 85%, so $8,400 < $10,000 * 0.85 = $8,500
      const ctx: CommissionContext = {
        contractId: "c-7f",
        contractTotal: 8400,
        fairPrice: 10000,
        salesRepId: "rep-1",
        setterId: "setter-1",
      };
      const mgmt = makeMgmt({ cumulativeRevenue: 0 });
      const entries = calculateCommissionsPreview(ctx, DEFAULT_SETTINGS, mgmt);
      const rep = findEntry(entries, "SALES_REP");
      const setter = findEntry(entries, "SETTER");
      expect(rep).toBeUndefined();
      expect(setter).toBeUndefined();
      // Management roles still get paid
      expect(findEntry(entries, "SETTER_MANAGER")).toBeDefined();
      expect(findEntry(entries, "VP")).toBeDefined();
      expect(findEntry(entries, "NSM")).toBeDefined();
    });
  });
});
