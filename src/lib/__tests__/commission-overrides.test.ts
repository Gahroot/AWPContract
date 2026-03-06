import { describe, it, expect } from "vitest";

import {
  calculateCommissionsPreview,
  type CommissionContext,
  type CommissionOverrideMap,
} from "../commission";
import type { CommissionSettings } from "@/generated/prisma/client";

// ─── Shared fixtures ──────────────────────────────────────────

type Settings = Omit<CommissionSettings, "id" | "createdAt" | "updatedAt">;

const SETTINGS: Settings = {
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

const SALES_REP_ID = "rep-001";
const SETTER_ID = "setter-001";
const SETTER_MGR_ID = "mgr-001";
const TERRITORY_OWNER_ID = "territory-001";
const VP_ID = "vp-001";
const NSM_ID = "nsm-001";

function makeCtx(overrides: Partial<CommissionContext> = {}): CommissionContext {
  return {
    contractId: "contract-001",
    contractTotal: 10000,
    fairPrice: 10000,
    salesRepId: SALES_REP_ID,
    setterId: SETTER_ID,
    ...overrides,
  };
}

function fullMgmt() {
  return {
    setterManagers: [{ id: SETTER_MGR_ID }],
    territoryOwners: [{ id: TERRITORY_OWNER_ID }],
    vps: [{ id: VP_ID }],
    nsms: [{ id: NSM_ID }],
    salesRepTerritoryId: "territory-abc",
    cumulativeRevenue: 0,
  };
}

function find(entries: ReturnType<typeof calculateCommissionsPreview>, type: string, userId?: string) {
  return entries.find(
    (e) => e.commissionType === type && (userId ? e.userId === userId : true)
  );
}

const round = (n: number) => Math.round(n * 100) / 100;

// ─── Tests ─────────────────────────────────────────────────────

describe("calculateCommissionsPreview — override system", () => {
  it("1. override for SALES_REP changes rate and adds 'Custom rate override' note", () => {
    const ctx = makeCtx();
    const overrides: CommissionOverrideMap = {
      [`${SALES_REP_ID}:SALES_REP`]: 0.15,
    };

    const entries = calculateCommissionsPreview(ctx, SETTINGS, fullMgmt(), overrides);
    const rep = find(entries, "SALES_REP")!;

    expect(rep).toBeDefined();
    expect(rep.rate).toBe(0.15);
    expect(rep.notes).toBe("Custom rate override");
    expect(rep.amount).toBe(round(10000 * 0.15));
  });

  it("2. override for SETTER changes rate", () => {
    const ctx = makeCtx(); // setterId !== salesRepId so not self-gen
    const overrides: CommissionOverrideMap = {
      [`${SETTER_ID}:SETTER`]: 0.08,
    };

    const entries = calculateCommissionsPreview(ctx, SETTINGS, fullMgmt(), overrides);
    const setter = find(entries, "SETTER")!;

    expect(setter).toBeDefined();
    expect(setter.rate).toBe(0.08);
    expect(setter.amount).toBe(round(10000 * 0.08));
    expect(setter.notes).toBe("Custom rate override");
  });

  it("3. override for SETTER_MANAGER changes rate", () => {
    const ctx = makeCtx();
    const overrides: CommissionOverrideMap = {
      [`${SETTER_MGR_ID}:SETTER_MANAGER`]: 0.04,
    };

    const entries = calculateCommissionsPreview(ctx, SETTINGS, fullMgmt(), overrides);
    const mgr = find(entries, "SETTER_MANAGER")!;

    expect(mgr).toBeDefined();
    expect(mgr.rate).toBe(0.04);
    expect(mgr.amount).toBe(round(10000 * 0.04));
    expect(mgr.notes).toBe("Custom rate override");
  });

  it("4. override for TERRITORY_OWNER changes rate (overrides tier logic)", () => {
    const ctx = makeCtx();
    // High cumulative revenue would normally pick tier 3 (0.02)
    const mgmt = fullMgmt();
    mgmt.cumulativeRevenue = 1500000;

    const overrides: CommissionOverrideMap = {
      [`${TERRITORY_OWNER_ID}:TERRITORY_OWNER`]: 0.035,
    };

    const entries = calculateCommissionsPreview(ctx, SETTINGS, mgmt, overrides);
    const owner = find(entries, "TERRITORY_OWNER")!;

    expect(owner).toBeDefined();
    expect(owner.rate).toBe(0.035);
    expect(owner.amount).toBe(round(10000 * 0.035));
    expect(owner.notes).toBe("Custom rate override");
    // tierLabel still reflects the tier even though rate is overridden
    expect(owner.tierLabel).toBe("Tier 3");
  });

  it("5. override for VP changes rate", () => {
    const ctx = makeCtx();
    const overrides: CommissionOverrideMap = {
      [`${VP_ID}:VP`]: 0.025,
    };

    const entries = calculateCommissionsPreview(ctx, SETTINGS, fullMgmt(), overrides);
    const vp = find(entries, "VP")!;

    expect(vp).toBeDefined();
    expect(vp.rate).toBe(0.025);
    expect(vp.amount).toBe(round(10000 * 0.025));
    expect(vp.notes).toBe("Custom rate override");
  });

  it("6. override for NSM changes rate", () => {
    const ctx = makeCtx();
    const overrides: CommissionOverrideMap = {
      [`${NSM_ID}:NSM`]: 0.012,
    };

    const entries = calculateCommissionsPreview(ctx, SETTINGS, fullMgmt(), overrides);
    const nsm = find(entries, "NSM")!;

    expect(nsm).toBeDefined();
    expect(nsm.rate).toBe(0.012);
    expect(nsm.amount).toBe(round(10000 * 0.012));
    expect(nsm.notes).toBe("Custom rate override");
  });

  it("7. multiple overrides at once (different users, different types)", () => {
    const ctx = makeCtx();
    const overrides: CommissionOverrideMap = {
      [`${SALES_REP_ID}:SALES_REP`]: 0.20,
      [`${SETTER_ID}:SETTER`]: 0.06,
      [`${VP_ID}:VP`]: 0.03,
    };

    const entries = calculateCommissionsPreview(ctx, SETTINGS, fullMgmt(), overrides);

    const rep = find(entries, "SALES_REP")!;
    const setter = find(entries, "SETTER")!;
    const vp = find(entries, "VP")!;

    expect(rep.rate).toBe(0.20);
    expect(rep.notes).toBe("Custom rate override");

    expect(setter.rate).toBe(0.06);
    expect(setter.notes).toBe("Custom rate override");

    expect(vp.rate).toBe(0.03);
    expect(vp.notes).toBe("Custom rate override");
  });

  it("8. override only applies to matching userId:type combo, not others", () => {
    const ctx = makeCtx();
    // Override VP for VP_ID, but not for NSM
    const overrides: CommissionOverrideMap = {
      [`${VP_ID}:VP`]: 0.05,
    };

    const entries = calculateCommissionsPreview(ctx, SETTINGS, fullMgmt(), overrides);

    const vp = find(entries, "VP")!;
    const nsm = find(entries, "NSM")!;
    const mgr = find(entries, "SETTER_MANAGER")!;

    expect(vp.rate).toBe(0.05);
    expect(vp.notes).toBe("Custom rate override");

    // NSM and setter manager should use default rates, no override note
    expect(nsm.rate).toBe(SETTINGS.nsmRate);
    expect(nsm.notes).toBeUndefined();

    expect(mgr.rate).toBe(SETTINGS.setterManagerRate);
    expect(mgr.notes).toBeUndefined();
  });

  it("9. override for a user that doesn't exist in management users is ignored", () => {
    const ctx = makeCtx();
    const overrides: CommissionOverrideMap = {
      ["nonexistent-user:VP"]: 0.99,
    };

    const entries = calculateCommissionsPreview(ctx, SETTINGS, fullMgmt(), overrides);

    // No entry should have rate 0.99
    expect(entries.every((e) => e.rate !== 0.99)).toBe(true);
    // VP still has its default rate
    const vp = find(entries, "VP")!;
    expect(vp.rate).toBe(SETTINGS.vpRate);
  });

  it("10. override with rate 0 produces $0 commission but entry still created", () => {
    const ctx = makeCtx();
    const overrides: CommissionOverrideMap = {
      [`${VP_ID}:VP`]: 0,
    };

    const entries = calculateCommissionsPreview(ctx, SETTINGS, fullMgmt(), overrides);
    const vp = find(entries, "VP")!;

    expect(vp).toBeDefined();
    expect(vp.rate).toBe(0);
    expect(vp.amount).toBe(0);
    expect(vp.notes).toBe("Custom rate override");
  });

  it("11. override with very high rate (0.50)", () => {
    const ctx = makeCtx();
    const overrides: CommissionOverrideMap = {
      [`${NSM_ID}:NSM`]: 0.50,
    };

    const entries = calculateCommissionsPreview(ctx, SETTINGS, fullMgmt(), overrides);
    const nsm = find(entries, "NSM")!;

    expect(nsm.rate).toBe(0.50);
    expect(nsm.amount).toBe(round(10000 * 0.50));
    expect(nsm.notes).toBe("Custom rate override");
  });

  it("12. override that would conflict with below-fair logic — override wins", () => {
    // Contract below fair price: contractTotal < fairPrice
    const ctx = makeCtx({ contractTotal: 8000, fairPrice: 10000 });
    const mgmt = fullMgmt();

    // Without override, VP gets belowFair rate (0.005)
    const entriesNoOverride = calculateCommissionsPreview(ctx, SETTINGS, mgmt, {});
    const vpDefault = find(entriesNoOverride, "VP")!;
    expect(vpDefault.rate).toBe(SETTINGS.vpRateBelowFair);
    expect(vpDefault.isBelowFair).toBe(true);

    // With override, we force a higher rate despite below-fair
    const overrides: CommissionOverrideMap = {
      [`${VP_ID}:VP`]: 0.03,
    };
    const entries = calculateCommissionsPreview(ctx, SETTINGS, mgmt, overrides);
    const vp = find(entries, "VP")!;

    expect(vp.rate).toBe(0.03);
    expect(vp.isBelowFair).toBe(true); // still flagged as below fair
    expect(vp.amount).toBe(round(8000 * 0.03));
    expect(vp.notes).toBe("Custom rate override");
  });

  it("13. override that would conflict with self-gen logic — override wins", () => {
    // Self-gen: setterId is null (traditional)
    const ctx = makeCtx({ setterId: null });
    const mgmt = fullMgmt();

    // Without override, sales rep gets traditional rate (0.12)
    const entriesNoOverride = calculateCommissionsPreview(ctx, SETTINGS, mgmt, {});
    const repDefault = find(entriesNoOverride, "SALES_REP")!;
    expect(repDefault.rate).toBe(SETTINGS.traditionalSalesRepRate);
    expect(repDefault.isSelfGen).toBe(true);

    // With override, we force a different rate
    const overrides: CommissionOverrideMap = {
      [`${SALES_REP_ID}:SALES_REP`]: 0.08,
    };
    const entries = calculateCommissionsPreview(ctx, SETTINGS, mgmt, overrides);
    const rep = find(entries, "SALES_REP")!;

    expect(rep.rate).toBe(0.08);
    expect(rep.isSelfGen).toBe(true); // still flagged as self-gen
    expect(rep.notes).toBe("Custom rate override");
  });

  it("14. override for sales rep doesn't affect ceiling/floor behavior", () => {
    // Contract above ceiling: contractTotal > fairPrice * ceiling
    // fairPrice=10000, ceiling=1.15, so capped revenue = 11500
    const ctx = makeCtx({ contractTotal: 15000, fairPrice: 10000 });
    const overrides: CommissionOverrideMap = {
      [`${SALES_REP_ID}:SALES_REP`]: 0.20,
    };

    const entries = calculateCommissionsPreview(ctx, SETTINGS, fullMgmt(), overrides);
    const rep = find(entries, "SALES_REP")!;

    // Revenue is capped at fairPrice * ceiling = 10000 * 1.15 = 11500
    expect(rep.rate).toBe(0.20);
    expect(rep.amount).toBe(round(11500 * 0.20));
    expect(rep.notes).toBe("Custom rate override");
  });

  it("15. non-overridden entries use default rates alongside overridden ones", () => {
    const ctx = makeCtx();
    const mgmt = fullMgmt();
    // Only override the VP
    const overrides: CommissionOverrideMap = {
      [`${VP_ID}:VP`]: 0.07,
    };

    const entries = calculateCommissionsPreview(ctx, SETTINGS, mgmt, overrides);

    // Overridden VP
    const vp = find(entries, "VP")!;
    expect(vp.rate).toBe(0.07);
    expect(vp.notes).toBe("Custom rate override");

    // Non-overridden entries retain defaults
    const rep = find(entries, "SALES_REP")!;
    expect(rep.rate).toBe(SETTINGS.salesRepRate);
    expect(rep.notes).toBeUndefined();

    const setter = find(entries, "SETTER")!;
    expect(setter.rate).toBe(SETTINGS.setterRate);
    expect(setter.notes).toBeUndefined();

    const mgr = find(entries, "SETTER_MANAGER")!;
    expect(mgr.rate).toBe(SETTINGS.setterManagerRate);
    expect(mgr.notes).toBeUndefined();

    const owner = find(entries, "TERRITORY_OWNER")!;
    expect(owner.rate).toBe(SETTINGS.territoryOwnerRateTier1);
    expect(owner.notes).toBeUndefined();

    const nsm = find(entries, "NSM")!;
    expect(nsm.rate).toBe(SETTINGS.nsmRate);
    expect(nsm.notes).toBeUndefined();
  });
});
