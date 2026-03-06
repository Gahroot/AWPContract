import { describe, it, expect } from "vitest";
import {
  calculateCommissionsPreview,
  type CommissionContext,
} from "@/lib/commission";
import type { CommissionSettings } from "@/generated/prisma/client";

// ─── Default settings matching DEFAULT_SETTINGS in commission.ts ─────

type Settings = Omit<CommissionSettings, "id" | "createdAt" | "updatedAt">;

const DEFAULT: Settings = {
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

// ─── Custom settings (all different from defaults) ───────────────────

const CUSTOM: Settings = {
  salesRepRate: 0.08,
  salesRepRateBelowFair: 0.04,
  salesRepFloor: 0.80,
  salesRepCeiling: 1.20,
  setterRate: 0.025,
  setterFloor: 0.80,
  setterManagerRate: 0.015,
  setterManagerRateBelowFair: 0.008,
  territoryOwnerRateTier1: 0.007,
  territoryOwnerRateTier2: 0.012,
  territoryOwnerRateTier3: 0.018,
  territoryOwnerTier2Threshold: 400000,
  territoryOwnerTier3Threshold: 800000,
  vpRate: 0.009,
  vpRateBelowFair: 0.004,
  nsmRate: 0.006,
  nsmRateBelowFair: 0.003,
  traditionalSalesRepRate: 0.14,
  traditionalSalesRepRateBelowFair: 0.06,
  traditionalFloorRate: 0.80,
  traditionalPriceCeiling: 1.20,
  traditionalNsmOverrideRate: 0.007,
  traditionalNsmOverrideRateBelowFair: 0.003,
};

// ─── Helpers ─────────────────────────────────────────────────────────

function find(entries: ReturnType<typeof calculateCommissionsPreview>, type: string) {
  return entries.find((e) => e.commissionType === type);
}

/** Setter-set context: salesRep and setter are different */
function setterSetCtx(total: number, fairPrice: number): CommissionContext {
  return {
    contractId: "c1",
    contractTotal: total,
    fairPrice,
    salesRepId: "rep-1",
    setterId: "setter-1",
  };
}

/** Self-gen context: no setter */
function selfGenCtx(total: number, fairPrice: number): CommissionContext {
  return {
    contractId: "c1",
    contractTotal: total,
    fairPrice,
    salesRepId: "rep-1",
    setterId: null,
  };
}

/** Full management users with one of each role */
function fullMgmt(cumulativeRevenue = 0) {
  return {
    setterManagers: [{ id: "mgr-1" }],
    territoryOwners: [{ id: "town-1" }],
    vps: [{ id: "vp-1" }],
    nsms: [{ id: "nsm-1" }],
    salesRepTerritoryId: "terr-1",
    cumulativeRevenue,
  };
}

/** Minimal management (no territory owners) */
function minMgmt() {
  return {
    setterManagers: [{ id: "mgr-1" }],
    territoryOwners: [],
    vps: [{ id: "vp-1" }],
    nsms: [{ id: "nsm-1" }],
    salesRepTerritoryId: null,
    cumulativeRevenue: 0,
  };
}

// =====================================================================
// SALES_REP
// =====================================================================

describe("SALES_REP rate selection", () => {
  it("setter-set + at-fair => salesRepRate (0.10)", () => {
    const entries = calculateCommissionsPreview(
      setterSetCtx(10000, 10000),
      DEFAULT,
      minMgmt(),
    );
    const sr = find(entries, "SALES_REP");
    expect(sr).toBeDefined();
    expect(sr!.rate).toBe(0.10);
    expect(sr!.isBelowFair).toBe(false);
    expect(sr!.isSelfGen).toBe(false);
  });

  it("setter-set + below-fair => salesRepRateBelowFair (0.05)", () => {
    const entries = calculateCommissionsPreview(
      setterSetCtx(9000, 10000),
      DEFAULT,
      minMgmt(),
    );
    const sr = find(entries, "SALES_REP");
    expect(sr).toBeDefined();
    expect(sr!.rate).toBe(0.05);
    expect(sr!.isBelowFair).toBe(true);
    expect(sr!.isSelfGen).toBe(false);
  });

  it("self-gen + at-fair => traditionalSalesRepRate (0.12)", () => {
    const entries = calculateCommissionsPreview(
      selfGenCtx(10000, 10000),
      DEFAULT,
      minMgmt(),
    );
    const sr = find(entries, "SALES_REP");
    expect(sr).toBeDefined();
    expect(sr!.rate).toBe(0.12);
    expect(sr!.isBelowFair).toBe(false);
    expect(sr!.isSelfGen).toBe(true);
    expect(sr!.tierLabel).toBe("Traditional");
  });

  it("self-gen + below-fair => traditionalSalesRepRateBelowFair (0.07)", () => {
    const entries = calculateCommissionsPreview(
      selfGenCtx(9000, 10000),
      DEFAULT,
      minMgmt(),
    );
    const sr = find(entries, "SALES_REP");
    expect(sr).toBeDefined();
    expect(sr!.rate).toBe(0.07);
    expect(sr!.isBelowFair).toBe(true);
    expect(sr!.isSelfGen).toBe(true);
  });

  it("not created when below floor", () => {
    // floor = 0.85 * 10000 = 8500, contractTotal = 8000 < 8500
    const entries = calculateCommissionsPreview(
      setterSetCtx(8000, 10000),
      DEFAULT,
      minMgmt(),
    );
    const sr = find(entries, "SALES_REP");
    expect(sr).toBeUndefined();
  });
});

// =====================================================================
// SETTER
// =====================================================================

describe("SETTER rate selection", () => {
  it("setter-set + at-fair => setterRate (0.03)", () => {
    const entries = calculateCommissionsPreview(
      setterSetCtx(10000, 10000),
      DEFAULT,
      minMgmt(),
    );
    const s = find(entries, "SETTER");
    expect(s).toBeDefined();
    expect(s!.rate).toBe(0.03);
    expect(s!.isSelfGen).toBe(false);
  });

  it("setter-set + below-fair => still setterRate (0.03), no below-fair variant", () => {
    const entries = calculateCommissionsPreview(
      setterSetCtx(9000, 10000),
      DEFAULT,
      minMgmt(),
    );
    const s = find(entries, "SETTER");
    expect(s).toBeDefined();
    expect(s!.rate).toBe(0.03);
    expect(s!.isBelowFair).toBe(true);
  });

  it("self-gen => SETTER not created", () => {
    const entries = calculateCommissionsPreview(
      selfGenCtx(10000, 10000),
      DEFAULT,
      minMgmt(),
    );
    const s = find(entries, "SETTER");
    expect(s).toBeUndefined();
  });

  it("setter-set below floor => SETTER not created", () => {
    const entries = calculateCommissionsPreview(
      setterSetCtx(8000, 10000),
      DEFAULT,
      minMgmt(),
    );
    const s = find(entries, "SETTER");
    expect(s).toBeUndefined();
  });

  it("setterId === salesRepId => treated as self-gen, no SETTER", () => {
    const ctx: CommissionContext = {
      contractId: "c1",
      contractTotal: 10000,
      fairPrice: 10000,
      salesRepId: "rep-1",
      setterId: "rep-1", // same as sales rep
    };
    const entries = calculateCommissionsPreview(ctx, DEFAULT, minMgmt());
    const s = find(entries, "SETTER");
    expect(s).toBeUndefined();
  });
});

// =====================================================================
// SETTER_MANAGER
// =====================================================================

describe("SETTER_MANAGER rate selection", () => {
  it("at-fair => setterManagerRate (0.02)", () => {
    const entries = calculateCommissionsPreview(
      setterSetCtx(10000, 10000),
      DEFAULT,
      minMgmt(),
    );
    const sm = find(entries, "SETTER_MANAGER");
    expect(sm).toBeDefined();
    expect(sm!.rate).toBe(0.02);
    expect(sm!.isBelowFair).toBe(false);
  });

  it("below-fair => setterManagerRateBelowFair (0.01)", () => {
    const entries = calculateCommissionsPreview(
      setterSetCtx(9000, 10000),
      DEFAULT,
      minMgmt(),
    );
    const sm = find(entries, "SETTER_MANAGER");
    expect(sm).toBeDefined();
    expect(sm!.rate).toBe(0.01);
    expect(sm!.isBelowFair).toBe(true);
  });

  it("created for self-gen contracts too", () => {
    const entries = calculateCommissionsPreview(
      selfGenCtx(10000, 10000),
      DEFAULT,
      minMgmt(),
    );
    const sm = find(entries, "SETTER_MANAGER");
    expect(sm).toBeDefined();
    expect(sm!.rate).toBe(0.02);
    expect(sm!.isSelfGen).toBe(true);
  });
});

// =====================================================================
// TERRITORY_OWNER
// =====================================================================

describe("TERRITORY_OWNER rate selection", () => {
  it("Tier 1: cumulative < 500k => territoryOwnerRateTier1 (0.01)", () => {
    const entries = calculateCommissionsPreview(
      setterSetCtx(10000, 10000),
      DEFAULT,
      fullMgmt(200000),
    );
    const to = find(entries, "TERRITORY_OWNER");
    expect(to).toBeDefined();
    expect(to!.rate).toBe(0.01);
    expect(to!.tierLabel).toBe("Tier 1");
  });

  it("Tier 2: cumulative >= 500k => territoryOwnerRateTier2 (0.015)", () => {
    const entries = calculateCommissionsPreview(
      setterSetCtx(10000, 10000),
      DEFAULT,
      fullMgmt(500000),
    );
    const to = find(entries, "TERRITORY_OWNER");
    expect(to).toBeDefined();
    expect(to!.rate).toBe(0.015);
    expect(to!.tierLabel).toBe("Tier 2");
  });

  it("Tier 2: cumulative 999999 => still Tier 2", () => {
    const entries = calculateCommissionsPreview(
      setterSetCtx(10000, 10000),
      DEFAULT,
      fullMgmt(999999),
    );
    const to = find(entries, "TERRITORY_OWNER");
    expect(to).toBeDefined();
    expect(to!.rate).toBe(0.015);
    expect(to!.tierLabel).toBe("Tier 2");
  });

  it("Tier 3: cumulative >= 1M => territoryOwnerRateTier3 (0.02)", () => {
    const entries = calculateCommissionsPreview(
      setterSetCtx(10000, 10000),
      DEFAULT,
      fullMgmt(1000000),
    );
    const to = find(entries, "TERRITORY_OWNER");
    expect(to).toBeDefined();
    expect(to!.rate).toBe(0.02);
    expect(to!.tierLabel).toBe("Tier 3");
  });

  it("not created when no territory", () => {
    const entries = calculateCommissionsPreview(
      setterSetCtx(10000, 10000),
      DEFAULT,
      minMgmt(), // salesRepTerritoryId = null
    );
    const to = find(entries, "TERRITORY_OWNER");
    expect(to).toBeUndefined();
  });

  it("not created when no territory owners in territory", () => {
    const mgmt = fullMgmt(200000);
    mgmt.territoryOwners = [];
    const entries = calculateCommissionsPreview(
      setterSetCtx(10000, 10000),
      DEFAULT,
      mgmt,
    );
    const to = find(entries, "TERRITORY_OWNER");
    expect(to).toBeUndefined();
  });
});

// =====================================================================
// VP
// =====================================================================

describe("VP rate selection", () => {
  it("at-fair => vpRate (0.01)", () => {
    const entries = calculateCommissionsPreview(
      setterSetCtx(10000, 10000),
      DEFAULT,
      minMgmt(),
    );
    const vp = find(entries, "VP");
    expect(vp).toBeDefined();
    expect(vp!.rate).toBe(0.01);
    expect(vp!.isBelowFair).toBe(false);
  });

  it("below-fair => vpRateBelowFair (0.005)", () => {
    const entries = calculateCommissionsPreview(
      setterSetCtx(9000, 10000),
      DEFAULT,
      minMgmt(),
    );
    const vp = find(entries, "VP");
    expect(vp).toBeDefined();
    expect(vp!.rate).toBe(0.005);
    expect(vp!.isBelowFair).toBe(true);
  });
});

// =====================================================================
// NSM
// =====================================================================

describe("NSM rate selection", () => {
  it("setter-set + at-fair => nsmRate (0.005)", () => {
    const entries = calculateCommissionsPreview(
      setterSetCtx(10000, 10000),
      DEFAULT,
      minMgmt(),
    );
    const nsm = find(entries, "NSM");
    expect(nsm).toBeDefined();
    expect(nsm!.rate).toBe(0.005);
    expect(nsm!.isBelowFair).toBe(false);
    expect(nsm!.isSelfGen).toBe(false);
  });

  it("setter-set + below-fair => nsmRateBelowFair (0.0025)", () => {
    const entries = calculateCommissionsPreview(
      setterSetCtx(9000, 10000),
      DEFAULT,
      minMgmt(),
    );
    const nsm = find(entries, "NSM");
    expect(nsm).toBeDefined();
    expect(nsm!.rate).toBe(0.0025);
    expect(nsm!.isBelowFair).toBe(true);
    expect(nsm!.isSelfGen).toBe(false);
  });

  it("self-gen + at-fair => traditionalNsmOverrideRate (0.005)", () => {
    const entries = calculateCommissionsPreview(
      selfGenCtx(10000, 10000),
      DEFAULT,
      minMgmt(),
    );
    const nsm = find(entries, "NSM");
    expect(nsm).toBeDefined();
    expect(nsm!.rate).toBe(0.005);
    expect(nsm!.isSelfGen).toBe(true);
  });

  it("self-gen + below-fair => traditionalNsmOverrideRateBelowFair (0.0025)", () => {
    const entries = calculateCommissionsPreview(
      selfGenCtx(9000, 10000),
      DEFAULT,
      minMgmt(),
    );
    const nsm = find(entries, "NSM");
    expect(nsm).toBeDefined();
    expect(nsm!.rate).toBe(0.0025);
    expect(nsm!.isSelfGen).toBe(true);
  });
});

// =====================================================================
// CUSTOM SETTINGS - verify settings object is actually used
// =====================================================================

describe("Custom settings are used (not hardcoded defaults)", () => {
  it("SALES_REP uses custom salesRepRate", () => {
    const entries = calculateCommissionsPreview(
      setterSetCtx(10000, 10000),
      CUSTOM,
      minMgmt(),
    );
    const sr = find(entries, "SALES_REP");
    expect(sr).toBeDefined();
    expect(sr!.rate).toBe(0.08); // CUSTOM.salesRepRate, not 0.10
  });

  it("SALES_REP uses custom salesRepRateBelowFair", () => {
    const entries = calculateCommissionsPreview(
      setterSetCtx(9000, 10000),
      CUSTOM,
      minMgmt(),
    );
    const sr = find(entries, "SALES_REP");
    expect(sr).toBeDefined();
    expect(sr!.rate).toBe(0.04); // CUSTOM.salesRepRateBelowFair
  });

  it("SALES_REP uses custom traditionalSalesRepRate (self-gen)", () => {
    const entries = calculateCommissionsPreview(
      selfGenCtx(10000, 10000),
      CUSTOM,
      minMgmt(),
    );
    const sr = find(entries, "SALES_REP");
    expect(sr).toBeDefined();
    expect(sr!.rate).toBe(0.14); // CUSTOM.traditionalSalesRepRate
  });

  it("SALES_REP uses custom traditionalSalesRepRateBelowFair (self-gen)", () => {
    const entries = calculateCommissionsPreview(
      selfGenCtx(9000, 10000),
      CUSTOM,
      minMgmt(),
    );
    const sr = find(entries, "SALES_REP");
    expect(sr).toBeDefined();
    expect(sr!.rate).toBe(0.06); // CUSTOM.traditionalSalesRepRateBelowFair
  });

  it("SETTER uses custom setterRate", () => {
    const entries = calculateCommissionsPreview(
      setterSetCtx(10000, 10000),
      CUSTOM,
      minMgmt(),
    );
    const s = find(entries, "SETTER");
    expect(s).toBeDefined();
    expect(s!.rate).toBe(0.025); // CUSTOM.setterRate
  });

  it("SETTER respects custom setterFloor", () => {
    // CUSTOM floor = 0.80, so 7900/10000 = 0.79 < 0.80 => no setter
    const entries = calculateCommissionsPreview(
      setterSetCtx(7900, 10000),
      CUSTOM,
      minMgmt(),
    );
    const s = find(entries, "SETTER");
    expect(s).toBeUndefined();

    // But 8100/10000 = 0.81 >= 0.80 => setter created
    const entries2 = calculateCommissionsPreview(
      setterSetCtx(8100, 10000),
      CUSTOM,
      minMgmt(),
    );
    const s2 = find(entries2, "SETTER");
    expect(s2).toBeDefined();
    expect(s2!.rate).toBe(0.025);
  });

  it("SETTER_MANAGER uses custom rates", () => {
    const atFair = calculateCommissionsPreview(
      setterSetCtx(10000, 10000),
      CUSTOM,
      minMgmt(),
    );
    expect(find(atFair, "SETTER_MANAGER")!.rate).toBe(0.015);

    const belowFair = calculateCommissionsPreview(
      setterSetCtx(9000, 10000),
      CUSTOM,
      minMgmt(),
    );
    expect(find(belowFair, "SETTER_MANAGER")!.rate).toBe(0.008);
  });

  it("TERRITORY_OWNER uses custom tier thresholds and rates", () => {
    // Custom thresholds: tier2 = 400k, tier3 = 800k
    const t1 = calculateCommissionsPreview(
      setterSetCtx(10000, 10000),
      CUSTOM,
      fullMgmt(300000),
    );
    expect(find(t1, "TERRITORY_OWNER")!.rate).toBe(0.007); // custom tier1
    expect(find(t1, "TERRITORY_OWNER")!.tierLabel).toBe("Tier 1");

    const t2 = calculateCommissionsPreview(
      setterSetCtx(10000, 10000),
      CUSTOM,
      fullMgmt(400000),
    );
    expect(find(t2, "TERRITORY_OWNER")!.rate).toBe(0.012); // custom tier2
    expect(find(t2, "TERRITORY_OWNER")!.tierLabel).toBe("Tier 2");

    const t3 = calculateCommissionsPreview(
      setterSetCtx(10000, 10000),
      CUSTOM,
      fullMgmt(800000),
    );
    expect(find(t3, "TERRITORY_OWNER")!.rate).toBe(0.018); // custom tier3
    expect(find(t3, "TERRITORY_OWNER")!.tierLabel).toBe("Tier 3");
  });

  it("VP uses custom rates", () => {
    const atFair = calculateCommissionsPreview(
      setterSetCtx(10000, 10000),
      CUSTOM,
      minMgmt(),
    );
    expect(find(atFair, "VP")!.rate).toBe(0.009);

    const belowFair = calculateCommissionsPreview(
      setterSetCtx(9000, 10000),
      CUSTOM,
      minMgmt(),
    );
    expect(find(belowFair, "VP")!.rate).toBe(0.004);
  });

  it("NSM uses custom rates (setter-set)", () => {
    const atFair = calculateCommissionsPreview(
      setterSetCtx(10000, 10000),
      CUSTOM,
      minMgmt(),
    );
    expect(find(atFair, "NSM")!.rate).toBe(0.006); // custom nsmRate

    const belowFair = calculateCommissionsPreview(
      setterSetCtx(9000, 10000),
      CUSTOM,
      minMgmt(),
    );
    expect(find(belowFair, "NSM")!.rate).toBe(0.003); // custom nsmRateBelowFair
  });

  it("NSM uses custom traditional rates (self-gen)", () => {
    const atFair = calculateCommissionsPreview(
      selfGenCtx(10000, 10000),
      CUSTOM,
      minMgmt(),
    );
    expect(find(atFair, "NSM")!.rate).toBe(0.007); // custom traditionalNsmOverrideRate

    const belowFair = calculateCommissionsPreview(
      selfGenCtx(9000, 10000),
      CUSTOM,
      minMgmt(),
    );
    expect(find(belowFair, "NSM")!.rate).toBe(0.003); // custom traditionalNsmOverrideRateBelowFair
  });
});

// =====================================================================
// Edge cases
// =====================================================================

describe("Edge cases", () => {
  it("returns empty array for zero contractTotal", () => {
    const entries = calculateCommissionsPreview(
      { contractId: "c1", contractTotal: 0, fairPrice: 10000, salesRepId: "rep-1", setterId: null },
      DEFAULT,
      fullMgmt(),
    );
    expect(entries).toEqual([]);
  });

  it("returns empty array for missing salesRepId", () => {
    const entries = calculateCommissionsPreview(
      { contractId: "c1", contractTotal: 10000, fairPrice: 10000, salesRepId: "", setterId: null },
      DEFAULT,
      fullMgmt(),
    );
    expect(entries).toEqual([]);
  });
});
