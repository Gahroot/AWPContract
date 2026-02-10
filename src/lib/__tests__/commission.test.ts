import { describe, it, expect, vi, beforeEach } from "vitest";

// vi.mock factory is hoisted — can't reference external variables
vi.mock("@/lib/db", () => ({
  db: {
    commissionConfig: {
      findFirst: vi.fn(),
    },
    commissionRate: {
      findUnique: vi.fn(),
    },
    commissionTier: {
      findMany: vi.fn(),
    },
    contract: {
      findUnique: vi.fn(),
    },
    commissionRecord: {
      deleteMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));

// Import after mock setup
import { calculateCommission, upsertCommissionForContract } from "../commission";
import { db } from "@/lib/db";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockDb = db as any;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("calculateCommission", () => {
  describe("edge cases", () => {
    it("returns $0 for $0 contracts", async () => {
      const result = await calculateCommission(0, "user1");
      expect(result.amount).toBe(0);
      expect(result.rate).toBe(0);
    });

    it("returns $0 for negative contracts", async () => {
      const result = await calculateCommission(-100, "user1");
      expect(result.amount).toBe(0);
    });

    it("returns $0 when no config exists", async () => {
      mockDb.commissionConfig.findFirst.mockResolvedValue(null);
      const result = await calculateCommission(10000, "user1");
      expect(result.amount).toBe(0);
      expect(result.modelType).toBe("FLAT_PERCENT");
    });
  });

  describe("FLAT_PERCENT model", () => {
    it("calculates flat 10% commission", async () => {
      mockDb.commissionConfig.findFirst.mockResolvedValue({
        id: "cfg1",
        modelType: "FLAT_PERCENT",
        flatRate: 0.1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const result = await calculateCommission(10000, "user1");
      expect(result.amount).toBe(1000);
      expect(result.rate).toBe(0.1);
      expect(result.modelType).toBe("FLAT_PERCENT");
      expect(result.contractTotal).toBe(10000);
    });

    it("calculates flat 5% commission", async () => {
      mockDb.commissionConfig.findFirst.mockResolvedValue({
        id: "cfg1",
        modelType: "FLAT_PERCENT",
        flatRate: 0.05,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const result = await calculateCommission(25000, "user1");
      expect(result.amount).toBe(1250);
      expect(result.rate).toBe(0.05);
    });

    it("handles 0% rate", async () => {
      mockDb.commissionConfig.findFirst.mockResolvedValue({
        id: "cfg1",
        modelType: "FLAT_PERCENT",
        flatRate: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const result = await calculateCommission(10000, "user1");
      expect(result.amount).toBe(0);
    });

    it("handles null flatRate", async () => {
      mockDb.commissionConfig.findFirst.mockResolvedValue({
        id: "cfg1",
        modelType: "FLAT_PERCENT",
        flatRate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const result = await calculateCommission(10000, "user1");
      expect(result.amount).toBe(0);
    });
  });

  describe("PER_SALESPERSON model", () => {
    it("uses individual rate when set", async () => {
      mockDb.commissionConfig.findFirst.mockResolvedValue({
        id: "cfg1",
        modelType: "PER_SALESPERSON",
        flatRate: 0.1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockDb.commissionRate.findUnique.mockResolvedValue({
        id: "r1",
        userId: "user1",
        rate: 0.15,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const result = await calculateCommission(10000, "user1");
      expect(result.amount).toBe(1500);
      expect(result.rate).toBe(0.15);
      expect(result.modelType).toBe("PER_SALESPERSON");
    });

    it("falls back to flatRate when no individual rate", async () => {
      mockDb.commissionConfig.findFirst.mockResolvedValue({
        id: "cfg1",
        modelType: "PER_SALESPERSON",
        flatRate: 0.1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockDb.commissionRate.findUnique.mockResolvedValue(null);
      const result = await calculateCommission(10000, "user1");
      expect(result.amount).toBe(1000);
      expect(result.rate).toBe(0.1);
    });
  });

  describe("TIERED model", () => {
    it("returns $0 when no tiers exist", async () => {
      mockDb.commissionConfig.findFirst.mockResolvedValue({
        id: "cfg1",
        modelType: "TIERED",
        flatRate: 0.1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockDb.commissionTier.findMany.mockResolvedValue([]);
      const result = await calculateCommission(10000, "user1");
      expect(result.amount).toBe(0);
    });

    it("calculates graduated tiers correctly", async () => {
      mockDb.commissionConfig.findFirst.mockResolvedValue({
        id: "cfg1",
        modelType: "TIERED",
        flatRate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockDb.commissionTier.findMany.mockResolvedValue([
        { id: "t1", minAmount: 0, maxAmount: 10000, rate: 0.05, sortOrder: 0, createdAt: new Date(), updatedAt: new Date() },
        { id: "t2", minAmount: 10000, maxAmount: 25000, rate: 0.08, sortOrder: 1, createdAt: new Date(), updatedAt: new Date() },
        { id: "t3", minAmount: 25000, maxAmount: null, rate: 0.12, sortOrder: 2, createdAt: new Date(), updatedAt: new Date() },
      ]);

      // $30,000 contract:
      // First $10,000 at 5% = $500
      // Next $15,000 at 8% = $1,200
      // Last $5,000 at 12% = $600
      // Total = $2,300
      const result = await calculateCommission(30000, "user1");
      expect(result.amount).toBe(2300);
      expect(result.modelType).toBe("TIERED");
      expect(result.contractTotal).toBe(30000);
    });

    it("handles amount within first tier only", async () => {
      mockDb.commissionConfig.findFirst.mockResolvedValue({
        id: "cfg1",
        modelType: "TIERED",
        flatRate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockDb.commissionTier.findMany.mockResolvedValue([
        { id: "t1", minAmount: 0, maxAmount: 10000, rate: 0.05, sortOrder: 0, createdAt: new Date(), updatedAt: new Date() },
        { id: "t2", minAmount: 10000, maxAmount: null, rate: 0.1, sortOrder: 1, createdAt: new Date(), updatedAt: new Date() },
      ]);

      const result = await calculateCommission(5000, "user1");
      expect(result.amount).toBe(250); // 5000 * 0.05
    });

    it("handles single unlimited tier", async () => {
      mockDb.commissionConfig.findFirst.mockResolvedValue({
        id: "cfg1",
        modelType: "TIERED",
        flatRate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockDb.commissionTier.findMany.mockResolvedValue([
        { id: "t1", minAmount: 0, maxAmount: null, rate: 0.1, sortOrder: 0, createdAt: new Date(), updatedAt: new Date() },
      ]);

      const result = await calculateCommission(50000, "user1");
      expect(result.amount).toBe(5000);
    });
  });
});

describe("upsertCommissionForContract", () => {
  it("does nothing for non-existent contract", async () => {
    mockDb.contract.findUnique.mockResolvedValue(null);
    await upsertCommissionForContract("nonexistent");
    expect(mockDb.commissionRecord.create).not.toHaveBeenCalled();
  });

  it("does nothing for non-COMPLETED contracts", async () => {
    mockDb.contract.findUnique.mockResolvedValue({
      id: "c1", status: "DRAFT", contractTotal: 10000, userId: "u1",
    });
    await upsertCommissionForContract("c1");
    expect(mockDb.commissionRecord.create).not.toHaveBeenCalled();
  });

  it("does nothing for contracts without userId", async () => {
    mockDb.contract.findUnique.mockResolvedValue({
      id: "c1", status: "COMPLETED", contractTotal: 10000, userId: null,
    });
    await upsertCommissionForContract("c1");
    expect(mockDb.commissionRecord.create).not.toHaveBeenCalled();
  });

  it("creates commission record for completed contract", async () => {
    mockDb.contract.findUnique.mockResolvedValue({
      id: "c1", status: "COMPLETED", contractTotal: 10000, userId: "u1",
    });
    mockDb.commissionConfig.findFirst.mockResolvedValue({
      id: "cfg1",
      modelType: "FLAT_PERCENT",
      flatRate: 0.1,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    mockDb.commissionRecord.deleteMany.mockResolvedValue({ count: 0 });
    mockDb.commissionRecord.create.mockResolvedValue({});

    await upsertCommissionForContract("c1", "Test note");

    expect(mockDb.commissionRecord.deleteMany).toHaveBeenCalledWith({
      where: { contractId: "c1" },
    });
    expect(mockDb.commissionRecord.create).toHaveBeenCalledWith({
      data: {
        contractId: "c1",
        userId: "u1",
        contractTotal: 10000,
        modelType: "FLAT_PERCENT",
        rate: 0.1,
        amount: 1000,
        notes: "Test note",
      },
    });
  });
});
