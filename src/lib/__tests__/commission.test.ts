import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  db: {
    commissionSettings: {
      findFirst: vi.fn(),
    },
    user: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    contract: {
      findUnique: vi.fn(),
      aggregate: vi.fn(),
    },
    commissionRecord: {
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

import {
  calculateAllCommissions,
  upsertCommissionsForContract,
  isBelowFair,
  isSelfGen,
  meetsFloor,
  commissionableRevenue,
  type CommissionContext,
} from "../commission";
import { db } from "@/lib/db";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockDb = db as any;

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

function makeCtx(overrides: Partial<CommissionContext> = {}): CommissionContext {
  return {
    contractId: "c1",
    contractTotal: 10000,
    fairPrice: 10000,
    salesRepId: "rep1",
    setterId: "setter1",
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  // Default: no management users
  mockDb.user.findMany.mockResolvedValue([]);
  mockDb.user.findUnique.mockResolvedValue({ territory: "SLC", market: "SLC" });
  mockDb.contract.aggregate.mockResolvedValue({ _sum: { contractTotal: 0 } });
});

describe("helper functions", () => {
  it("isBelowFair returns true when contractTotal < fairPrice", () => {
    expect(isBelowFair(9000, 10000)).toBe(true);
    expect(isBelowFair(10000, 10000)).toBe(false);
    expect(isBelowFair(11000, 10000)).toBe(false);
  });

  it("isSelfGen detects self-gen correctly", () => {
    expect(isSelfGen("rep1", null)).toBe(true);
    expect(isSelfGen("rep1", "rep1")).toBe(true);
    expect(isSelfGen("rep1", "setter1")).toBe(false);
  });

  it("meetsFloor checks floor correctly", () => {
    expect(meetsFloor(8500, 10000, 0.85)).toBe(true);
    expect(meetsFloor(8499, 10000, 0.85)).toBe(false);
  });

  it("commissionableRevenue caps at ceiling", () => {
    expect(commissionableRevenue(12000, 10000, 1.15)).toBe(11500);
    expect(commissionableRevenue(10000, 10000, 1.15)).toBe(10000);
  });
});

describe("calculateAllCommissions", () => {
  describe("edge cases", () => {
    it("returns empty array for $0 contracts", async () => {
      const entries = await calculateAllCommissions(makeCtx({ contractTotal: 0 }), DEFAULT_SETTINGS);
      expect(entries).toHaveLength(0);
    });

    it("returns empty array for negative contracts", async () => {
      const entries = await calculateAllCommissions(makeCtx({ contractTotal: -100 }), DEFAULT_SETTINGS);
      expect(entries).toHaveLength(0);
    });

    it("returns empty array when no salesRepId", async () => {
      const entries = await calculateAllCommissions(makeCtx({ salesRepId: "" }), DEFAULT_SETTINGS);
      expect(entries).toHaveLength(0);
    });
  });

  describe("self-gen detection", () => {
    it("uses traditional rates when setterId is null", async () => {
      const entries = await calculateAllCommissions(
        makeCtx({ setterId: null }),
        DEFAULT_SETTINGS
      );
      const repEntry = entries.find((e) => e.commissionType === "SALES_REP");
      expect(repEntry).toBeDefined();
      expect(repEntry!.rate).toBe(0.12); // traditionalSalesRepRate
      expect(repEntry!.isSelfGen).toBe(true);
    });

    it("uses traditional rates when setterId === salesRepId", async () => {
      const entries = await calculateAllCommissions(
        makeCtx({ setterId: "rep1" }),
        DEFAULT_SETTINGS
      );
      const repEntry = entries.find((e) => e.commissionType === "SALES_REP");
      expect(repEntry!.rate).toBe(0.12);
      expect(repEntry!.isSelfGen).toBe(true);
    });

    it("does not create setter entry on self-gen", async () => {
      const entries = await calculateAllCommissions(
        makeCtx({ setterId: null }),
        DEFAULT_SETTINGS
      );
      const setterEntry = entries.find((e) => e.commissionType === "SETTER");
      expect(setterEntry).toBeUndefined();
    });
  });

  describe("below-fair detection", () => {
    it("uses below-fair rate when contractTotal < fairPrice", async () => {
      const entries = await calculateAllCommissions(
        makeCtx({ contractTotal: 9000, fairPrice: 10000 }),
        DEFAULT_SETTINGS
      );
      const repEntry = entries.find((e) => e.commissionType === "SALES_REP");
      expect(repEntry!.rate).toBe(0.05); // salesRepRateBelowFair
      expect(repEntry!.isBelowFair).toBe(true);
    });
  });

  describe("sales rep", () => {
    it("calculates at-fair rate for setter-set", async () => {
      const entries = await calculateAllCommissions(makeCtx(), DEFAULT_SETTINGS);
      const repEntry = entries.find((e) => e.commissionType === "SALES_REP");
      expect(repEntry!.rate).toBe(0.10);
      expect(repEntry!.amount).toBe(1000);
      expect(repEntry!.isSelfGen).toBe(false);
    });

    it("enforces floor - no commission below floor", async () => {
      const entries = await calculateAllCommissions(
        makeCtx({ contractTotal: 8000, fairPrice: 10000 }),
        DEFAULT_SETTINGS
      );
      const repEntry = entries.find((e) => e.commissionType === "SALES_REP");
      // 8000 < 10000 * 0.85 = 8500, so floor not met
      expect(repEntry).toBeUndefined();
    });

    it("caps commission at ceiling", async () => {
      const entries = await calculateAllCommissions(
        makeCtx({ contractTotal: 15000, fairPrice: 10000 }),
        DEFAULT_SETTINGS
      );
      const repEntry = entries.find((e) => e.commissionType === "SALES_REP");
      // ceiling = 10000 * 1.15 = 11500, so commissionable = 11500
      expect(repEntry!.amount).toBe(1150); // 11500 * 0.10
    });
  });

  describe("setter", () => {
    it("creates setter entry only on setter-set", async () => {
      const entries = await calculateAllCommissions(makeCtx(), DEFAULT_SETTINGS);
      const setterEntry = entries.find((e) => e.commissionType === "SETTER");
      expect(setterEntry).toBeDefined();
      expect(setterEntry!.userId).toBe("setter1");
      expect(setterEntry!.rate).toBe(0.03);
      expect(setterEntry!.amount).toBe(300);
    });

    it("enforces setter floor", async () => {
      const entries = await calculateAllCommissions(
        makeCtx({ contractTotal: 8000, fairPrice: 10000 }),
        DEFAULT_SETTINGS
      );
      const setterEntry = entries.find((e) => e.commissionType === "SETTER");
      // 8000 < 10000 * 0.85, floor not met
      expect(setterEntry).toBeUndefined();
    });
  });

  describe("setter manager", () => {
    it("creates entry for setter managers", async () => {
      // First call returns setter managers, rest return empty
      mockDb.user.findMany
        .mockResolvedValueOnce([]) // no setter managers (first call for setter managers - wrong order)
      ;

      // Actually, findMany is called multiple times. Let me set them up properly.
      // The order: setterManagers, then territory owners, then VPs, then NSMs
      mockDb.user.findMany
        .mockReset()
        .mockResolvedValueOnce([{ id: "mgr1" }]) // setter managers
        .mockResolvedValueOnce([]) // territory owners
        .mockResolvedValueOnce([]) // VPs
        .mockResolvedValueOnce([]); // NSMs

      const entries = await calculateAllCommissions(makeCtx(), DEFAULT_SETTINGS);
      const mgrEntry = entries.find((e) => e.commissionType === "SETTER_MANAGER");
      expect(mgrEntry).toBeDefined();
      expect(mgrEntry!.userId).toBe("mgr1");
      expect(mgrEntry!.rate).toBe(0.02); // at-fair rate
      expect(mgrEntry!.amount).toBe(200);
    });

    it("uses below-fair rate when applicable", async () => {
      mockDb.user.findMany
        .mockReset()
        .mockResolvedValueOnce([{ id: "mgr1" }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const entries = await calculateAllCommissions(
        makeCtx({ contractTotal: 9000, fairPrice: 10000 }),
        DEFAULT_SETTINGS
      );
      const mgrEntry = entries.find((e) => e.commissionType === "SETTER_MANAGER");
      expect(mgrEntry!.rate).toBe(0.01); // below-fair rate
    });
  });

  describe("territory owner", () => {
    it("applies tier 1 rate for low cumulative revenue", async () => {
      mockDb.user.findMany
        .mockReset()
        .mockResolvedValueOnce([]) // setter managers
        .mockResolvedValueOnce([{ id: "owner1" }]) // territory owners
        .mockResolvedValueOnce([]) // VPs
        .mockResolvedValueOnce([]); // NSMs
      mockDb.contract.aggregate.mockResolvedValue({ _sum: { contractTotal: 100000 } });

      const entries = await calculateAllCommissions(makeCtx(), DEFAULT_SETTINGS);
      const ownerEntry = entries.find((e) => e.commissionType === "TERRITORY_OWNER");
      expect(ownerEntry).toBeDefined();
      expect(ownerEntry!.rate).toBe(0.01);
      expect(ownerEntry!.tierLabel).toBe("Tier 1");
    });

    it("applies tier 2 rate at threshold", async () => {
      mockDb.user.findMany
        .mockReset()
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ id: "owner1" }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      mockDb.contract.aggregate.mockResolvedValue({ _sum: { contractTotal: 500000 } });

      const entries = await calculateAllCommissions(makeCtx(), DEFAULT_SETTINGS);
      const ownerEntry = entries.find((e) => e.commissionType === "TERRITORY_OWNER");
      expect(ownerEntry!.rate).toBe(0.015);
      expect(ownerEntry!.tierLabel).toBe("Tier 2");
    });

    it("applies tier 3 rate at threshold", async () => {
      mockDb.user.findMany
        .mockReset()
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ id: "owner1" }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      mockDb.contract.aggregate.mockResolvedValue({ _sum: { contractTotal: 1500000 } });

      const entries = await calculateAllCommissions(makeCtx(), DEFAULT_SETTINGS);
      const ownerEntry = entries.find((e) => e.commissionType === "TERRITORY_OWNER");
      expect(ownerEntry!.rate).toBe(0.02);
      expect(ownerEntry!.tierLabel).toBe("Tier 3");
    });
  });

  describe("VP", () => {
    it("creates VP entry with at-fair rate", async () => {
      mockDb.user.findMany
        .mockReset()
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ id: "vp1" }])
        .mockResolvedValueOnce([]);

      const entries = await calculateAllCommissions(makeCtx(), DEFAULT_SETTINGS);
      const vpEntry = entries.find((e) => e.commissionType === "VP");
      expect(vpEntry).toBeDefined();
      expect(vpEntry!.rate).toBe(0.01);
      expect(vpEntry!.amount).toBe(100);
    });

    it("uses below-fair rate", async () => {
      mockDb.user.findMany
        .mockReset()
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ id: "vp1" }])
        .mockResolvedValueOnce([]);

      const entries = await calculateAllCommissions(
        makeCtx({ contractTotal: 9000, fairPrice: 10000 }),
        DEFAULT_SETTINGS
      );
      const vpEntry = entries.find((e) => e.commissionType === "VP");
      expect(vpEntry!.rate).toBe(0.005);
    });
  });

  describe("NSM", () => {
    it("uses standard rates for setter-set", async () => {
      mockDb.user.findMany
        .mockReset()
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ id: "nsm1" }]);

      const entries = await calculateAllCommissions(makeCtx(), DEFAULT_SETTINGS);
      const nsmEntry = entries.find((e) => e.commissionType === "NSM");
      expect(nsmEntry!.rate).toBe(0.005); // nsmRate
    });

    it("uses traditional rates for self-gen", async () => {
      mockDb.user.findMany
        .mockReset()
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ id: "nsm1" }]);

      const entries = await calculateAllCommissions(
        makeCtx({ setterId: null }),
        DEFAULT_SETTINGS
      );
      const nsmEntry = entries.find((e) => e.commissionType === "NSM");
      expect(nsmEntry!.rate).toBe(0.005); // traditionalNsmOverrideRate
    });
  });

  describe("full integration", () => {
    it("produces multiple entries for a contract with all roles", async () => {
      mockDb.user.findMany
        .mockReset()
        .mockResolvedValueOnce([{ id: "mgr1" }]) // setter managers
        .mockResolvedValueOnce([{ id: "owner1" }]) // territory owners
        .mockResolvedValueOnce([{ id: "vp1" }]) // VPs
        .mockResolvedValueOnce([{ id: "nsm1" }]); // NSMs

      const entries = await calculateAllCommissions(makeCtx(), DEFAULT_SETTINGS);

      // Should have: SALES_REP, SETTER, SETTER_MANAGER, TERRITORY_OWNER, VP, NSM = 6 entries
      expect(entries).toHaveLength(6);

      const types = entries.map((e) => e.commissionType);
      expect(types).toContain("SALES_REP");
      expect(types).toContain("SETTER");
      expect(types).toContain("SETTER_MANAGER");
      expect(types).toContain("TERRITORY_OWNER");
      expect(types).toContain("VP");
      expect(types).toContain("NSM");
    });
  });
});

describe("upsertCommissionsForContract", () => {
  it("does nothing for non-existent contract", async () => {
    mockDb.contract.findUnique.mockResolvedValue(null);
    await upsertCommissionsForContract("nonexistent");
    expect(mockDb.$transaction).not.toHaveBeenCalled();
  });

  it("does nothing for non-COMPLETED contracts", async () => {
    mockDb.contract.findUnique.mockResolvedValue({
      id: "c1", status: "DRAFT", contractTotal: 10000, total: 10000, userId: "u1", salesRepId: null, setterId: null,
    });
    await upsertCommissionsForContract("c1");
    expect(mockDb.$transaction).not.toHaveBeenCalled();
  });

  it("does nothing for contracts without userId or salesRepId", async () => {
    mockDb.contract.findUnique.mockResolvedValue({
      id: "c1", status: "COMPLETED", contractTotal: 10000, total: 10000, userId: null, salesRepId: null, setterId: null,
    });
    await upsertCommissionsForContract("c1");
    expect(mockDb.$transaction).not.toHaveBeenCalled();
  });

  it("deletes old records and creates new ones in transaction", async () => {
    mockDb.contract.findUnique.mockResolvedValue({
      id: "c1", status: "COMPLETED", contractTotal: 10000, total: 10000, userId: "u1", salesRepId: "u1", setterId: null,
    });
    mockDb.commissionSettings.findFirst.mockResolvedValue(DEFAULT_SETTINGS);

    // Mock the transaction to execute the callback
    mockDb.$transaction.mockImplementation(async (fn: (tx: typeof mockDb) => Promise<void>) => {
      await fn(mockDb);
    });
    mockDb.commissionRecord.deleteMany.mockResolvedValue({ count: 0 });
    mockDb.commissionRecord.createMany.mockResolvedValue({ count: 1 });

    await upsertCommissionsForContract("c1", "Test note");

    expect(mockDb.$transaction).toHaveBeenCalled();
    expect(mockDb.commissionRecord.deleteMany).toHaveBeenCalledWith({
      where: { contractId: "c1" },
    });
    expect(mockDb.commissionRecord.createMany).toHaveBeenCalled();

    // Verify the created records
    const createCall = mockDb.commissionRecord.createMany.mock.calls[0][0];
    expect(createCall.data.length).toBeGreaterThan(0);
    expect(createCall.data[0].commissionType).toBe("SALES_REP");
    expect(createCall.data[0].isSelfGen).toBe(true); // setterId is null
  });
});
