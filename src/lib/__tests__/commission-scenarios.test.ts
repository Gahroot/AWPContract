import { describe, it, expect } from "vitest";
import {
  calculateCommissionsPreview,
  type CommissionContext,
  type CommissionOverrideMap,
} from "@/lib/commission";
import type { CommissionSettings } from "@/generated/prisma/client";

// ─── Helpers ─────────────────────────────────────────────────

type Settings = Omit<CommissionSettings, "id" | "createdAt" | "updatedAt">;

const DEFAULT_SETTINGS: Settings = {
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

function makeSettings(overrides: Partial<Settings> = {}): Settings {
  return { ...DEFAULT_SETTINGS, ...overrides };
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
    setterManagers: [],
    territoryOwners: [],
    vps: [],
    nsms: [],
    salesRepTerritoryId: null,
    cumulativeRevenue: 0,
    ...overrides,
  };
}

function findEntry(entries: ReturnType<typeof calculateCommissionsPreview>, type: string, userId?: string) {
  return entries.find(
    (e) => e.commissionType === type && (userId ? e.userId === userId : true)
  );
}

function findEntries(entries: ReturnType<typeof calculateCommissionsPreview>, type: string) {
  return entries.filter((e) => e.commissionType === type);
}

// ─── Scenarios ───────────────────────────────────────────────

describe("Commission Scenarios", () => {
  // ─── Scenario 1: Small residential job, setter-set ───────
  describe("Scenario 1: Small residential job, setter-set", () => {
    const ctx: CommissionContext = {
      contractId: "contract-1",
      contractTotal: 5000,
      fairPrice: 5000,
      salesRepId: "rep-1",
      setterId: "setter-1",
    };

    const mgmt = makeMgmt({
      setterManagers: [{ id: "smgr-1" }],
      vps: [{ id: "vp-1" }],
      nsms: [{ id: "nsm-1" }],
      territoryOwners: [{ id: "town-1" }],
      salesRepTerritoryId: "territory-1",
      cumulativeRevenue: 100000, // tier 1
    });

    const entries = calculateCommissionsPreview(ctx, makeSettings(), mgmt);

    it("produces exactly 6 entries", () => {
      expect(entries).toHaveLength(6);
    });

    it("sales rep gets 10% of $5,000 = $500", () => {
      const e = findEntry(entries, "SALES_REP")!;
      expect(e.userId).toBe("rep-1");
      expect(e.rate).toBe(0.10);
      expect(e.amount).toBe(500);
      expect(e.isSelfGen).toBe(false);
      expect(e.isBelowFair).toBe(false);
    });

    it("setter gets 3% of $5,000 = $150", () => {
      const e = findEntry(entries, "SETTER")!;
      expect(e.userId).toBe("setter-1");
      expect(e.rate).toBe(0.03);
      expect(e.amount).toBe(150);
    });

    it("setter manager gets 2% of $5,000 = $100", () => {
      const e = findEntry(entries, "SETTER_MANAGER")!;
      expect(e.rate).toBe(0.02);
      expect(e.amount).toBe(100);
    });

    it("territory owner gets 1% (tier 1) of $5,000 = $50", () => {
      const e = findEntry(entries, "TERRITORY_OWNER")!;
      expect(e.rate).toBe(0.01);
      expect(e.amount).toBe(50);
      expect(e.tierLabel).toBe("Tier 1");
    });

    it("VP gets 1% of $5,000 = $50", () => {
      const e = findEntry(entries, "VP")!;
      expect(e.rate).toBe(0.01);
      expect(e.amount).toBe(50);
    });

    it("NSM gets 0.5% of $5,000 = $25", () => {
      const e = findEntry(entries, "NSM")!;
      expect(e.rate).toBe(0.005);
      expect(e.amount).toBe(25);
    });
  });

  // ─── Scenario 2: Large commercial job, self-gen ──────────
  describe("Scenario 2: Large commercial job, self-gen", () => {
    const ctx: CommissionContext = {
      contractId: "contract-2",
      contractTotal: 50000,
      fairPrice: 50000,
      salesRepId: "rep-2",
      setterId: null, // self-gen
    };

    const mgmt = makeMgmt({
      vps: [{ id: "vp-1" }, { id: "vp-2" }],
      nsms: [{ id: "nsm-1" }],
    });

    const entries = calculateCommissionsPreview(ctx, makeSettings(), mgmt);

    it("produces 4 entries (rep + 2 VPs + NSM)", () => {
      expect(entries).toHaveLength(4);
    });

    it("sales rep gets traditional 12% of $50,000 = $6,000", () => {
      const e = findEntry(entries, "SALES_REP")!;
      expect(e.rate).toBe(0.12);
      expect(e.amount).toBe(6000);
      expect(e.isSelfGen).toBe(true);
      expect(e.tierLabel).toBe("Traditional");
    });

    it("no setter entry exists", () => {
      expect(findEntry(entries, "SETTER")).toBeUndefined();
    });

    it("both VPs get 1% of $50,000 = $500 each", () => {
      const vpEntries = findEntries(entries, "VP");
      expect(vpEntries).toHaveLength(2);
      vpEntries.forEach((e) => {
        expect(e.rate).toBe(0.01);
        expect(e.amount).toBe(500);
      });
    });

    it("NSM gets traditional NSM rate 0.5% of $50,000 = $250", () => {
      const e = findEntry(entries, "NSM")!;
      // self-gen uses traditionalNsmOverrideRate
      expect(e.rate).toBe(0.005);
      expect(e.amount).toBe(250);
    });
  });

  // ─── Scenario 3: Heavily discounted (below fair, above floor) ──
  describe("Scenario 3: Heavily discounted job (below fair, above floor)", () => {
    // $9,000 / $10,000 = 90%, above 85% floor
    const ctx: CommissionContext = {
      contractId: "contract-3",
      contractTotal: 9000,
      fairPrice: 10000,
      salesRepId: "rep-3",
      setterId: "setter-3",
    };

    const mgmt = makeMgmt({
      setterManagers: [{ id: "smgr-1" }],
      vps: [{ id: "vp-1" }],
      nsms: [{ id: "nsm-1" }],
      territoryOwners: [{ id: "town-1" }],
      salesRepTerritoryId: "territory-1",
      cumulativeRevenue: 200000,
    });

    const entries = calculateCommissionsPreview(ctx, makeSettings(), mgmt);

    it("all entries marked isBelowFair", () => {
      entries.forEach((e) => {
        expect(e.isBelowFair).toBe(true);
      });
    });

    it("sales rep uses below-fair rate 5% of $9,000 = $450", () => {
      const e = findEntry(entries, "SALES_REP")!;
      expect(e.rate).toBe(0.05);
      expect(e.amount).toBe(450);
    });

    it("setter still gets 3% (no below-fair variant) = $270", () => {
      const e = findEntry(entries, "SETTER")!;
      expect(e.rate).toBe(0.03);
      expect(e.amount).toBe(270);
    });

    it("setter manager uses below-fair rate 1% = $90", () => {
      const e = findEntry(entries, "SETTER_MANAGER")!;
      expect(e.rate).toBe(0.01);
      expect(e.amount).toBe(90);
    });

    it("VP uses below-fair rate 0.5% = $45", () => {
      const e = findEntry(entries, "VP")!;
      expect(e.rate).toBe(0.005);
      expect(e.amount).toBe(45);
    });

    it("NSM uses below-fair rate 0.25% = $22.50", () => {
      const e = findEntry(entries, "NSM")!;
      expect(e.rate).toBe(0.0025);
      expect(e.amount).toBe(22.5);
    });
  });

  // ─── Scenario 4: Job below floor price ───────────────────
  describe("Scenario 4: Job below floor price", () => {
    // $8,000 / $10,000 = 80%, below 85% floor
    const ctx: CommissionContext = {
      contractId: "contract-4",
      contractTotal: 8000,
      fairPrice: 10000,
      salesRepId: "rep-4",
      setterId: "setter-4",
    };

    const mgmt = makeMgmt({
      setterManagers: [{ id: "smgr-1" }],
      vps: [{ id: "vp-1" }],
      nsms: [{ id: "nsm-1" }],
      territoryOwners: [{ id: "town-1" }],
      salesRepTerritoryId: "territory-1",
      cumulativeRevenue: 50000,
    });

    const entries = calculateCommissionsPreview(ctx, makeSettings(), mgmt);

    it("sales rep gets NO commission (below floor)", () => {
      expect(findEntry(entries, "SALES_REP")).toBeUndefined();
    });

    it("setter gets NO commission (below floor)", () => {
      expect(findEntry(entries, "SETTER")).toBeUndefined();
    });

    it("setter manager still gets commission", () => {
      const e = findEntry(entries, "SETTER_MANAGER")!;
      expect(e).toBeDefined();
      expect(e.rate).toBe(0.01); // below-fair rate
      expect(e.amount).toBe(80);
    });

    it("VP still gets commission", () => {
      const e = findEntry(entries, "VP")!;
      expect(e).toBeDefined();
      expect(e.amount).toBe(40); // 0.005 * 8000
    });

    it("NSM still gets commission", () => {
      const e = findEntry(entries, "NSM")!;
      expect(e).toBeDefined();
      expect(e.amount).toBe(20); // 0.0025 * 8000
    });

    it("territory owner still gets commission", () => {
      const e = findEntry(entries, "TERRITORY_OWNER")!;
      expect(e).toBeDefined();
      expect(e.amount).toBe(80); // 0.01 * 8000
    });

    it("produces exactly 4 entries (no rep, no setter)", () => {
      expect(entries).toHaveLength(4);
    });
  });

  // ─── Scenario 5: Premium-priced job (above ceiling) ──────
  describe("Scenario 5: Premium-priced job (above ceiling)", () => {
    // $15,000 contract, $10,000 fair price → ceiling = $11,500 (1.15 * 10000)
    const ctx: CommissionContext = {
      contractId: "contract-5",
      contractTotal: 15000,
      fairPrice: 10000,
      salesRepId: "rep-5",
      setterId: "setter-5",
    };

    const mgmt = makeMgmt({
      setterManagers: [{ id: "smgr-1" }],
      vps: [{ id: "vp-1" }],
      nsms: [{ id: "nsm-1" }],
    });

    const entries = calculateCommissionsPreview(ctx, makeSettings(), mgmt);

    it("sales rep commission capped at ceiling: 10% of $11,500 = $1,150", () => {
      const e = findEntry(entries, "SALES_REP")!;
      expect(e.rate).toBe(0.10);
      expect(e.amount).toBe(1150);
    });

    it("setter uses full contractTotal: 3% of $15,000 = $450", () => {
      const e = findEntry(entries, "SETTER")!;
      expect(e.amount).toBe(450);
    });

    it("setter manager uses full contractTotal: 2% of $15,000 = $300", () => {
      const e = findEntry(entries, "SETTER_MANAGER")!;
      expect(e.amount).toBe(300);
    });

    it("VP uses full contractTotal: 1% of $15,000 = $150", () => {
      const e = findEntry(entries, "VP")!;
      expect(e.amount).toBe(150);
    });

    it("NSM uses full contractTotal: 0.5% of $15,000 = $75", () => {
      const e = findEntry(entries, "NSM")!;
      expect(e.amount).toBe(75);
    });
  });

  // ─── Scenario 6: Territory owner tier progression ────────
  describe("Scenario 6: Territory owner tier progression", () => {
    const ctx: CommissionContext = {
      contractId: "contract-6",
      contractTotal: 20000,
      fairPrice: 20000,
      salesRepId: "rep-6",
      setterId: null,
    };

    const baseMgmt = {
      setterManagers: [] as { id: string }[],
      vps: [] as { id: string }[],
      nsms: [] as { id: string }[],
      territoryOwners: [{ id: "town-1" }],
      salesRepTerritoryId: "territory-1",
    };

    it("tier 1 at $100k cumulative: rate = 1%, label = Tier 1", () => {
      const entries = calculateCommissionsPreview(
        ctx,
        makeSettings(),
        makeMgmt({ ...baseMgmt, cumulativeRevenue: 100000 })
      );
      const e = findEntry(entries, "TERRITORY_OWNER")!;
      expect(e.rate).toBe(0.01);
      expect(e.tierLabel).toBe("Tier 1");
      expect(e.amount).toBe(200);
    });

    it("tier 2 at $500k cumulative: rate = 1.5%, label = Tier 2", () => {
      const entries = calculateCommissionsPreview(
        ctx,
        makeSettings(),
        makeMgmt({ ...baseMgmt, cumulativeRevenue: 500000 })
      );
      const e = findEntry(entries, "TERRITORY_OWNER")!;
      expect(e.rate).toBe(0.015);
      expect(e.tierLabel).toBe("Tier 2");
      expect(e.amount).toBe(300);
    });

    it("tier 3 at $1.5M cumulative: rate = 2%, label = Tier 3", () => {
      const entries = calculateCommissionsPreview(
        ctx,
        makeSettings(),
        makeMgmt({ ...baseMgmt, cumulativeRevenue: 1500000 })
      );
      const e = findEntry(entries, "TERRITORY_OWNER")!;
      expect(e.rate).toBe(0.02);
      expect(e.tierLabel).toBe("Tier 3");
      expect(e.amount).toBe(400);
    });
  });

  // ─── Scenario 7: Custom settings (non-default) ──────────
  describe("Scenario 7: Custom settings (all rates doubled)", () => {
    const ctx: CommissionContext = {
      contractId: "contract-7",
      contractTotal: 10000,
      fairPrice: 10000,
      salesRepId: "rep-7",
      setterId: "setter-7",
    };

    const doubledSettings = makeSettings({
      salesRepRate: 0.20,
      setterRate: 0.06,
      setterManagerRate: 0.04,
      vpRate: 0.02,
      nsmRate: 0.01,
      territoryOwnerRateTier1: 0.02,
    });

    const mgmt = makeMgmt({
      setterManagers: [{ id: "smgr-1" }],
      vps: [{ id: "vp-1" }],
      nsms: [{ id: "nsm-1" }],
      territoryOwners: [{ id: "town-1" }],
      salesRepTerritoryId: "territory-1",
      cumulativeRevenue: 50000,
    });

    const entries = calculateCommissionsPreview(ctx, doubledSettings, mgmt);

    it("sales rep gets doubled rate 20% = $2,000", () => {
      expect(findEntry(entries, "SALES_REP")!.amount).toBe(2000);
    });

    it("setter gets doubled rate 6% = $600", () => {
      expect(findEntry(entries, "SETTER")!.amount).toBe(600);
    });

    it("setter manager gets doubled rate 4% = $400", () => {
      expect(findEntry(entries, "SETTER_MANAGER")!.amount).toBe(400);
    });

    it("VP gets doubled rate 2% = $200", () => {
      expect(findEntry(entries, "VP")!.amount).toBe(200);
    });

    it("NSM gets doubled rate 1% = $100", () => {
      expect(findEntry(entries, "NSM")!.amount).toBe(100);
    });

    it("territory owner gets doubled rate 2% = $200", () => {
      expect(findEntry(entries, "TERRITORY_OWNER")!.amount).toBe(200);
    });
  });

  // ─── Scenario 8: Mixed overrides with real-world rates ───
  describe("Scenario 8: Mixed overrides with real-world rates", () => {
    const ctx: CommissionContext = {
      contractId: "contract-8",
      contractTotal: 25000,
      fairPrice: 25000,
      salesRepId: "rep-8",
      setterId: "setter-8",
    };

    const mgmt = makeMgmt({
      setterManagers: [{ id: "smgr-1" }],
      vps: [{ id: "vp-1" }, { id: "vp-2" }],
      nsms: [{ id: "nsm-1" }],
    });

    const overrides: CommissionOverrideMap = {
      "vp-1:VP": 0.015, // VP-1 has custom higher rate
      "setter-8:SETTER": 0.05, // setter has override
      // rep-8 and vp-2 do NOT have overrides
    };

    const entries = calculateCommissionsPreview(ctx, makeSettings(), mgmt, overrides);

    it("sales rep uses default rate (no override): 10% = $2,500", () => {
      const e = findEntry(entries, "SALES_REP")!;
      expect(e.rate).toBe(0.10);
      expect(e.amount).toBe(2500);
      expect(e.notes).toBeUndefined();
    });

    it("setter uses override rate 5% = $1,250 with note", () => {
      const e = findEntry(entries, "SETTER")!;
      expect(e.rate).toBe(0.05);
      expect(e.amount).toBe(1250);
      expect(e.notes).toBe("Custom rate override");
    });

    it("VP-1 uses override rate 1.5% = $375", () => {
      const e = findEntry(entries, "VP", "vp-1")!;
      expect(e.rate).toBe(0.015);
      expect(e.amount).toBe(375);
      expect(e.notes).toBe("Custom rate override");
    });

    it("VP-2 uses default rate 1% = $250 (no override)", () => {
      const e = findEntry(entries, "VP", "vp-2")!;
      expect(e.rate).toBe(0.01);
      expect(e.amount).toBe(250);
      expect(e.notes).toBeUndefined();
    });
  });

  // ─── Scenario 9: Self-gen below fair with overrides ──────
  describe("Scenario 9: Self-gen below fair with overrides", () => {
    // $42,500 / $50,000 = 85%, exactly at floor (meetsFloor is >=)
    const ctx: CommissionContext = {
      contractId: "contract-9",
      contractTotal: 42500,
      fairPrice: 50000,
      salesRepId: "rep-9",
      setterId: null, // self-gen
    };

    const mgmt = makeMgmt({
      setterManagers: [{ id: "smgr-1" }],
      vps: [{ id: "vp-1" }],
      nsms: [{ id: "nsm-1" }],
      territoryOwners: [{ id: "town-1" }],
      salesRepTerritoryId: "territory-1",
      cumulativeRevenue: 750000, // tier 2
    });

    const overrides: CommissionOverrideMap = {
      "nsm-1:NSM": 0.008, // custom NSM rate
    };

    const entries = calculateCommissionsPreview(ctx, makeSettings(), mgmt, overrides);

    it("sales rep uses traditional below-fair rate 7%", () => {
      const e = findEntry(entries, "SALES_REP")!;
      expect(e.rate).toBe(0.07);
      expect(e.isSelfGen).toBe(true);
      expect(e.isBelowFair).toBe(true);
      expect(e.tierLabel).toBe("Traditional");
      expect(e.amount).toBe(2975); // 42500 * 0.07
    });

    it("no setter entry (self-gen)", () => {
      expect(findEntry(entries, "SETTER")).toBeUndefined();
    });

    it("setter manager uses below-fair rate 1% = $425", () => {
      const e = findEntry(entries, "SETTER_MANAGER")!;
      expect(e.rate).toBe(0.01);
      expect(e.amount).toBe(425);
    });

    it("VP uses below-fair rate 0.5% = $212.50", () => {
      const e = findEntry(entries, "VP")!;
      expect(e.rate).toBe(0.005);
      expect(e.amount).toBe(212.5);
    });

    it("NSM uses overridden rate 0.8% (not traditional below-fair default)", () => {
      const e = findEntry(entries, "NSM")!;
      expect(e.rate).toBe(0.008);
      expect(e.amount).toBe(340); // 42500 * 0.008
      expect(e.notes).toBe("Custom rate override");
    });

    it("territory owner at tier 2: 1.5% = $637.50", () => {
      const e = findEntry(entries, "TERRITORY_OWNER")!;
      expect(e.rate).toBe(0.015);
      expect(e.tierLabel).toBe("Tier 2");
      expect(e.amount).toBe(637.5);
    });
  });

  // ─── Scenario 10: No management structure ────────────────
  describe("Scenario 10: No management structure", () => {
    it("self-gen with no managers produces single entry (sales rep only)", () => {
      const ctx: CommissionContext = {
        contractId: "contract-10a",
        contractTotal: 12000,
        fairPrice: 12000,
        salesRepId: "rep-10",
        setterId: null,
      };

      const entries = calculateCommissionsPreview(ctx, makeSettings(), makeMgmt());

      expect(entries).toHaveLength(1);
      const e = entries[0];
      expect(e.commissionType).toBe("SALES_REP");
      expect(e.rate).toBe(0.12); // traditional
      expect(e.amount).toBe(1440);
      expect(e.isSelfGen).toBe(true);
    });

    it("setter-set with no managers produces two entries (rep + setter)", () => {
      const ctx: CommissionContext = {
        contractId: "contract-10b",
        contractTotal: 12000,
        fairPrice: 12000,
        salesRepId: "rep-10",
        setterId: "setter-10",
      };

      const entries = calculateCommissionsPreview(ctx, makeSettings(), makeMgmt());

      expect(entries).toHaveLength(2);
      expect(findEntry(entries, "SALES_REP")).toBeDefined();
      expect(findEntry(entries, "SETTER")).toBeDefined();
      expect(findEntry(entries, "SALES_REP")!.amount).toBe(1200); // 10% * 12000
      expect(findEntry(entries, "SETTER")!.amount).toBe(360); // 3% * 12000
    });
  });
});
