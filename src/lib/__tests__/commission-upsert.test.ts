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
    userCommissionOverride: {
      findMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

import {
  upsertCommissionsForContract,
  calculateAllCommissions,
  getCumulativeTerritoryRevenue,
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

function makeCompletedContract(overrides: Record<string, unknown> = {}) {
  return {
    id: "c1",
    status: "COMPLETED",
    contractTotal: 10000,
    total: 10000,
    userId: "user1",
    salesRepId: "rep1",
    setterId: "setter1",
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  // Default mock returns for management user queries
  mockDb.user.findMany.mockResolvedValue([]);
  mockDb.user.findUnique.mockResolvedValue({ territoryId: null });
  mockDb.contract.aggregate.mockResolvedValue({ _sum: { contractTotal: 0 } });
  mockDb.userCommissionOverride.findMany.mockResolvedValue([]);
  mockDb.commissionSettings.findFirst.mockResolvedValue(null);
});

// ─── upsertCommissionsForContract ──────────────────────────────

describe("upsertCommissionsForContract", () => {
  it("does not transact when contract is not found", async () => {
    mockDb.contract.findUnique.mockResolvedValue(null);
    await upsertCommissionsForContract("nonexistent");
    expect(mockDb.$transaction).not.toHaveBeenCalled();
  });

  it("does not transact when contract status is DRAFT", async () => {
    mockDb.contract.findUnique.mockResolvedValue(makeCompletedContract({ status: "DRAFT" }));
    await upsertCommissionsForContract("c1");
    expect(mockDb.$transaction).not.toHaveBeenCalled();
  });

  it("does not transact when contract status is PENDING_SIGNATURE", async () => {
    mockDb.contract.findUnique.mockResolvedValue(makeCompletedContract({ status: "PENDING_SIGNATURE" }));
    await upsertCommissionsForContract("c1");
    expect(mockDb.$transaction).not.toHaveBeenCalled();
  });

  it("does not transact when contract status is SIGNED", async () => {
    mockDb.contract.findUnique.mockResolvedValue(makeCompletedContract({ status: "SIGNED" }));
    await upsertCommissionsForContract("c1");
    expect(mockDb.$transaction).not.toHaveBeenCalled();
  });

  it("processes commissions when contract status is COMPLETED", async () => {
    mockDb.contract.findUnique.mockResolvedValue(makeCompletedContract());
    mockDb.commissionSettings.findFirst.mockResolvedValue(DEFAULT_SETTINGS);
    mockDb.$transaction.mockImplementation(async (fn: (tx: typeof mockDb) => Promise<void>) => {
      await fn(mockDb);
    });
    mockDb.commissionRecord.deleteMany.mockResolvedValue({ count: 0 });
    mockDb.commissionRecord.createMany.mockResolvedValue({ count: 1 });

    await upsertCommissionsForContract("c1");

    expect(mockDb.$transaction).toHaveBeenCalled();
  });

  it("uses userId as salesRepId when salesRepId is null", async () => {
    mockDb.contract.findUnique.mockResolvedValue(
      makeCompletedContract({ salesRepId: null, userId: "user1" })
    );
    mockDb.commissionSettings.findFirst.mockResolvedValue(DEFAULT_SETTINGS);
    // user.findUnique for salesRep lookup should use "user1"
    mockDb.user.findUnique.mockResolvedValue({ territoryId: null });
    mockDb.$transaction.mockImplementation(async (fn: (tx: typeof mockDb) => Promise<void>) => {
      await fn(mockDb);
    });
    mockDb.commissionRecord.deleteMany.mockResolvedValue({ count: 0 });
    mockDb.commissionRecord.createMany.mockResolvedValue({ count: 1 });

    await upsertCommissionsForContract("c1");

    expect(mockDb.$transaction).toHaveBeenCalled();
    const createCall = mockDb.commissionRecord.createMany.mock.calls[0][0];
    // The sales rep entry should use "user1" as the userId (fallback)
    const salesRepEntry = createCall.data.find(
      (d: Record<string, unknown>) => d.commissionType === "SALES_REP"
    );
    expect(salesRepEntry).toBeDefined();
    expect(salesRepEntry.userId).toBe("user1");
  });

  it("uses salesRepId when both salesRepId and userId are present", async () => {
    mockDb.contract.findUnique.mockResolvedValue(
      makeCompletedContract({ salesRepId: "rep1", userId: "user1" })
    );
    mockDb.commissionSettings.findFirst.mockResolvedValue(DEFAULT_SETTINGS);
    mockDb.$transaction.mockImplementation(async (fn: (tx: typeof mockDb) => Promise<void>) => {
      await fn(mockDb);
    });
    mockDb.commissionRecord.deleteMany.mockResolvedValue({ count: 0 });
    mockDb.commissionRecord.createMany.mockResolvedValue({ count: 1 });

    await upsertCommissionsForContract("c1");

    const createCall = mockDb.commissionRecord.createMany.mock.calls[0][0];
    const salesRepEntry = createCall.data.find(
      (d: Record<string, unknown>) => d.commissionType === "SALES_REP"
    );
    expect(salesRepEntry.userId).toBe("rep1");
  });

  it("does not transact when neither salesRepId nor userId is present", async () => {
    mockDb.contract.findUnique.mockResolvedValue(
      makeCompletedContract({ salesRepId: null, userId: null })
    );
    await upsertCommissionsForContract("c1");
    expect(mockDb.$transaction).not.toHaveBeenCalled();
  });

  it("deletes old records before creating new ones in transaction", async () => {
    mockDb.contract.findUnique.mockResolvedValue(makeCompletedContract());
    mockDb.commissionSettings.findFirst.mockResolvedValue(DEFAULT_SETTINGS);

    const callOrder: string[] = [];
    mockDb.$transaction.mockImplementation(async (fn: (tx: typeof mockDb) => Promise<void>) => {
      await fn(mockDb);
    });
    mockDb.commissionRecord.deleteMany.mockImplementation(async () => {
      callOrder.push("delete");
      return { count: 1 };
    });
    mockDb.commissionRecord.createMany.mockImplementation(async () => {
      callOrder.push("create");
      return { count: 1 };
    });

    await upsertCommissionsForContract("c1");

    expect(callOrder[0]).toBe("delete");
    expect(callOrder[1]).toBe("create");
    expect(mockDb.commissionRecord.deleteMany).toHaveBeenCalledWith({
      where: { contractId: "c1" },
    });
  });

  it("passes notes parameter through to created records", async () => {
    mockDb.contract.findUnique.mockResolvedValue(makeCompletedContract());
    mockDb.commissionSettings.findFirst.mockResolvedValue(DEFAULT_SETTINGS);
    mockDb.$transaction.mockImplementation(async (fn: (tx: typeof mockDb) => Promise<void>) => {
      await fn(mockDb);
    });
    mockDb.commissionRecord.deleteMany.mockResolvedValue({ count: 0 });
    mockDb.commissionRecord.createMany.mockResolvedValue({ count: 1 });

    await upsertCommissionsForContract("c1", "Manual recalculation");

    const createCall = mockDb.commissionRecord.createMany.mock.calls[0][0];
    for (const record of createCall.data) {
      expect(record.notes).toBe("Manual recalculation");
    }
  });

  it("runs transaction with empty createMany data for $0 contract total", async () => {
    // contractTotal = 0 means calculateAllCommissions returns [] (early return)
    // But upsertCommissionsForContract still calls $transaction because status is COMPLETED
    // Actually, looking at the code: ctx.contractTotal = contract.contractTotal
    // calculateAllCommissions returns [] for contractTotal <= 0
    // Then entries.length === 0 so createMany is NOT called, but deleteMany still is
    mockDb.contract.findUnique.mockResolvedValue(
      makeCompletedContract({ contractTotal: 0 })
    );
    mockDb.commissionSettings.findFirst.mockResolvedValue(DEFAULT_SETTINGS);
    mockDb.$transaction.mockImplementation(async (fn: (tx: typeof mockDb) => Promise<void>) => {
      await fn(mockDb);
    });
    mockDb.commissionRecord.deleteMany.mockResolvedValue({ count: 0 });

    await upsertCommissionsForContract("c1");

    expect(mockDb.$transaction).toHaveBeenCalled();
    expect(mockDb.commissionRecord.deleteMany).toHaveBeenCalledWith({
      where: { contractId: "c1" },
    });
    // createMany should NOT be called since entries is empty
    expect(mockDb.commissionRecord.createMany).not.toHaveBeenCalled();
  });

  it("creates records with all CommissionRecord schema fields", async () => {
    mockDb.contract.findUnique.mockResolvedValue(
      makeCompletedContract({ setterId: null }) // self-gen for simplicity
    );
    mockDb.commissionSettings.findFirst.mockResolvedValue(DEFAULT_SETTINGS);
    mockDb.$transaction.mockImplementation(async (fn: (tx: typeof mockDb) => Promise<void>) => {
      await fn(mockDb);
    });
    mockDb.commissionRecord.deleteMany.mockResolvedValue({ count: 0 });
    mockDb.commissionRecord.createMany.mockResolvedValue({ count: 1 });

    await upsertCommissionsForContract("c1", "Test note");

    const createCall = mockDb.commissionRecord.createMany.mock.calls[0][0];
    const record = createCall.data[0];

    // Verify all expected fields are present
    expect(record).toHaveProperty("contractId", "c1");
    expect(record).toHaveProperty("userId", "rep1");
    expect(record).toHaveProperty("commissionType", "SALES_REP");
    expect(record).toHaveProperty("contractTotal", 10000);
    expect(record).toHaveProperty("fairPrice", 10000);
    expect(record).toHaveProperty("isBelowFair", false);
    expect(record).toHaveProperty("isSelfGen", true);
    expect(record).toHaveProperty("rate");
    expect(record).toHaveProperty("amount");
    expect(record).toHaveProperty("tierLabel");
    expect(record).toHaveProperty("notes", "Test note");
    expect(typeof record.rate).toBe("number");
    expect(typeof record.amount).toBe("number");
  });
});

// ─── calculateAllCommissions (DB interaction) ──────────────────

describe("calculateAllCommissions - DB interaction", () => {
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

  it("uses DB settings when no settings parameter provided", async () => {
    const customSettings = { ...DEFAULT_SETTINGS, salesRepRate: 0.20 };
    mockDb.commissionSettings.findFirst.mockResolvedValue(customSettings);

    const entries = await calculateAllCommissions(makeCtx());
    const repEntry = entries.find((e) => e.commissionType === "SALES_REP");

    expect(mockDb.commissionSettings.findFirst).toHaveBeenCalled();
    expect(repEntry!.rate).toBe(0.20);
  });

  it("falls back to DEFAULT_SETTINGS when no DB settings row exists", async () => {
    mockDb.commissionSettings.findFirst.mockResolvedValue(null);

    const entries = await calculateAllCommissions(makeCtx());
    const repEntry = entries.find((e) => e.commissionType === "SALES_REP");

    // Default salesRepRate is 0.10
    expect(repEntry!.rate).toBe(0.10);
  });

  it("uses provided settings parameter when given", async () => {
    const customSettings = { ...DEFAULT_SETTINGS, salesRepRate: 0.25 };

    const entries = await calculateAllCommissions(makeCtx(), customSettings);
    const repEntry = entries.find((e) => e.commissionType === "SALES_REP");

    // Should NOT call DB for settings
    expect(mockDb.commissionSettings.findFirst).not.toHaveBeenCalled();
    expect(repEntry!.rate).toBe(0.25);
  });

  it("loads management users from DB by boolean flags", async () => {
    mockDb.user.findMany
      .mockReset()
      .mockResolvedValueOnce([{ id: "mgr1" }])   // isSetterManager: true
      .mockResolvedValueOnce([{ id: "vp1" }])     // isVP: true
      .mockResolvedValueOnce([{ id: "nsm1" }]);   // isNSM: true

    const entries = await calculateAllCommissions(makeCtx(), DEFAULT_SETTINGS);

    // Verify the queries were made with correct where clauses
    expect(mockDb.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { isSetterManager: true } })
    );
    expect(mockDb.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { isVP: true } })
    );
    expect(mockDb.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { isNSM: true } })
    );

    const types = entries.map((e) => e.commissionType);
    expect(types).toContain("SETTER_MANAGER");
    expect(types).toContain("VP");
    expect(types).toContain("NSM");
  });

  it("loads territory owners only when sales rep has a territoryId", async () => {
    // Sales rep WITHOUT territory
    mockDb.user.findUnique.mockResolvedValue({ territoryId: null });

    await calculateAllCommissions(makeCtx(), DEFAULT_SETTINGS);

    // Territory owner query should NOT happen (only 3 findMany calls for setterManagers, VPs, NSMs)
    const findManyCalls = mockDb.user.findMany.mock.calls;
    const territoryOwnerCall = findManyCalls.find(
      (call: Record<string, unknown>[]) =>
        (call[0] as Record<string, Record<string, unknown>>)?.where?.isTerritoryOwner === true
    );
    expect(territoryOwnerCall).toBeUndefined();

    // Now test WITH territory
    vi.clearAllMocks();
    mockDb.user.findMany
      .mockResolvedValueOnce([])   // setter managers
      .mockResolvedValueOnce([])   // VPs
      .mockResolvedValueOnce([])   // NSMs
      .mockResolvedValueOnce([{ id: "owner1" }]); // territory owners
    mockDb.user.findUnique.mockResolvedValue({ territoryId: "t1" });
    mockDb.contract.aggregate.mockResolvedValue({ _sum: { contractTotal: 0 } });
    mockDb.userCommissionOverride.findMany.mockResolvedValue([]);

    await calculateAllCommissions(makeCtx(), DEFAULT_SETTINGS);

    const findManyCalls2 = mockDb.user.findMany.mock.calls;
    const territoryOwnerCall2 = findManyCalls2.find(
      (call: Record<string, unknown>[]) =>
        (call[0] as Record<string, Record<string, unknown>>)?.where?.isTerritoryOwner === true
    );
    expect(territoryOwnerCall2).toBeDefined();
  });

  it("loads and applies active commission overrides from DB", async () => {
    mockDb.userCommissionOverride.findMany.mockResolvedValue([
      { userId: "rep1", commissionType: "SALES_REP", rateOverride: 0.15, isActive: true },
    ]);

    const entries = await calculateAllCommissions(makeCtx(), DEFAULT_SETTINGS);
    const repEntry = entries.find((e) => e.commissionType === "SALES_REP");

    expect(mockDb.userCommissionOverride.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { isActive: true } })
    );
    expect(repEntry!.rate).toBe(0.15);
    expect(repEntry!.notes).toBe("Custom rate override");
  });

  it("builds override map correctly from UserCommissionOverride records", async () => {
    mockDb.user.findMany
      .mockReset()
      .mockResolvedValueOnce([{ id: "mgr1" }])   // setter managers
      .mockResolvedValueOnce([{ id: "vp1" }])     // VPs
      .mockResolvedValueOnce([{ id: "nsm1" }]);   // NSMs

    mockDb.userCommissionOverride.findMany.mockResolvedValue([
      { userId: "rep1", commissionType: "SALES_REP", rateOverride: 0.18, isActive: true },
      { userId: "mgr1", commissionType: "SETTER_MANAGER", rateOverride: 0.05, isActive: true },
      { userId: "vp1", commissionType: "VP", rateOverride: 0.03, isActive: true },
    ]);

    const entries = await calculateAllCommissions(makeCtx(), DEFAULT_SETTINGS);

    const repEntry = entries.find((e) => e.commissionType === "SALES_REP");
    const mgrEntry = entries.find((e) => e.commissionType === "SETTER_MANAGER");
    const vpEntry = entries.find((e) => e.commissionType === "VP");

    expect(repEntry!.rate).toBe(0.18);
    expect(mgrEntry!.rate).toBe(0.05);
    expect(vpEntry!.rate).toBe(0.03);
  });
});

// ─── getCumulativeTerritoryRevenue ─────────────────────────────

describe("getCumulativeTerritoryRevenue", () => {
  it("aggregates COMPLETED contracts by territory", async () => {
    mockDb.contract.aggregate.mockResolvedValue({ _sum: { contractTotal: 250000 } });

    const result = await getCumulativeTerritoryRevenue("t1");

    expect(result).toBe(250000);
    expect(mockDb.contract.aggregate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: "COMPLETED",
          salesRep: { territoryId: "t1" },
        }),
        _sum: { contractTotal: true },
      })
    );
  });

  it("excludes the specified contractId", async () => {
    mockDb.contract.aggregate.mockResolvedValue({ _sum: { contractTotal: 100000 } });

    await getCumulativeTerritoryRevenue("t1", "exclude-me");

    expect(mockDb.contract.aggregate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: { not: "exclude-me" },
        }),
      })
    );
  });

  it("only counts contracts from current year", async () => {
    mockDb.contract.aggregate.mockResolvedValue({ _sum: { contractTotal: 50000 } });

    await getCumulativeTerritoryRevenue("t1");

    const callArgs = mockDb.contract.aggregate.mock.calls[0][0];
    const yearStart = new Date(new Date().getFullYear(), 0, 1);
    expect(callArgs.where.createdAt).toEqual({ gte: yearStart });
  });

  it("returns 0 when no matching contracts", async () => {
    mockDb.contract.aggregate.mockResolvedValue({ _sum: { contractTotal: null } });

    const result = await getCumulativeTerritoryRevenue("t1");
    expect(result).toBe(0);
  });
});
