import { vi, describe, it, expect, beforeEach } from "vitest";

// ----------------------------------------------------------------
// Mocks — vi.hoisted ensures variables exist before vi.mock factories run
// ----------------------------------------------------------------

const {
  mockAuth,
  mockDb,
  mockUpsertCommissionsForContract,
  mockCalculateCommissionsPreview,
  mockGetCumulativeTerritoryRevenue,
  mockValidateRoleAssignments,
} = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockDb: {} as Record<string, unknown>,
  mockUpsertCommissionsForContract: vi.fn(),
  mockCalculateCommissionsPreview: vi.fn(),
  mockGetCumulativeTerritoryRevenue: vi.fn(),
  mockValidateRoleAssignments: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ auth: (...args: unknown[]) => mockAuth(...args) }));
vi.mock("@/lib/db", () => ({ db: mockDb }));
vi.mock("@/lib/commission", () => ({
  upsertCommissionsForContract: (...args: unknown[]) => mockUpsertCommissionsForContract(...args),
  calculateCommissionsPreview: (...args: unknown[]) => mockCalculateCommissionsPreview(...args),
  getCumulativeTerritoryRevenue: (...args: unknown[]) => mockGetCumulativeTerritoryRevenue(...args),
}));
vi.mock("@/lib/commission-validation", () => ({
  validateRoleAssignments: (...args: unknown[]) => mockValidateRoleAssignments(...args),
}));

// ----------------------------------------------------------------
// Imports (loaded after mocks are wired)
// ----------------------------------------------------------------

import { NextRequest } from "next/server";
import { GET as configGET, PUT as configPUT } from "@/app/api/commissions/config/route";
import { POST as recalculateAllPOST } from "@/app/api/commissions/recalculate/route";
import { POST as recalculateSinglePOST } from "@/app/api/commissions/recalculate/[contractId]/route";
import { POST as previewPOST } from "@/app/api/commissions/preview/route";
import { GET as validateGET } from "@/app/api/commissions/validate/route";
import { POST as statusPOST } from "@/app/api/commissions/status/route";
import { GET as exportGET } from "@/app/api/commissions/export/route";
import { POST as recalculateUserPOST } from "@/app/api/commissions/recalculate-user/route";
import { GET as commissionsListGET } from "@/app/api/commissions/route";

// ----------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------

const ADMIN_SESSION = { user: { id: "admin-1", role: "ADMIN", name: "Admin" } };
const SALES_SESSION = { user: { id: "sales-1", role: "SALESMAN", name: "Sales Rep" } };

function nextRequest(url: string, init?: RequestInit) {
  return new NextRequest(new URL(url), init as never);
}

function jsonRequest(url: string, body?: Record<string, unknown>) {
  return nextRequest(url, {
    method: body ? "POST" : "GET",
    headers: { "Content-Type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}

function putRequest(url: string, body: Record<string, unknown>) {
  return nextRequest(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

/** Valid commission settings payload */
function validSettings() {
  return {
    salesRepRate: 0.1,
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
}

// ----------------------------------------------------------------
// Setup
// ----------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  // Reset mock db methods
  Object.keys(mockDb).forEach((k) => delete mockDb[k]);
});

// ================================================================
// GET /api/commissions/config
// ================================================================

describe("GET /api/commissions/config", () => {
  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await configGET();
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe("Unauthorized");
  });

  it("returns settings and managementUsers for authenticated user", async () => {
    mockAuth.mockResolvedValue(SALES_SESSION);
    const fakeSettings = { id: "s1", salesRepRate: 0.1 };
    const fakeUsers = [{ id: "u1", name: "Manager", email: "m@test.com", isSetterManager: true }];

    mockDb.commissionSettings = { findFirst: vi.fn().mockResolvedValue(fakeSettings) };
    mockDb.user = { findMany: vi.fn().mockResolvedValue(fakeUsers) };

    const res = await configGET();
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data).toHaveProperty("settings");
    expect(data).toHaveProperty("managementUsers");
    expect(data.settings).toEqual(fakeSettings);
    expect(data.managementUsers).toEqual(fakeUsers);
  });

  it("returns settings: null when no settings exist", async () => {
    mockAuth.mockResolvedValue(ADMIN_SESSION);
    mockDb.commissionSettings = { findFirst: vi.fn().mockResolvedValue(null) };
    mockDb.user = { findMany: vi.fn().mockResolvedValue([]) };

    const res = await configGET();
    const data = await res.json();
    expect(data.settings).toBeNull();
  });

  it("handles database errors gracefully", async () => {
    mockAuth.mockResolvedValue(ADMIN_SESSION);
    mockDb.commissionSettings = {
      findFirst: vi.fn().mockRejectedValue(new Error("DB connection lost")),
    };

    await expect(configGET()).rejects.toThrow("DB connection lost");
  });
});

// ================================================================
// PUT /api/commissions/config
// ================================================================

describe("PUT /api/commissions/config", () => {
  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await configPUT(putRequest("http://localhost/api/commissions/config", validSettings()));
    expect(res.status).toBe(401);
  });

  it("returns 401 for non-admin users", async () => {
    mockAuth.mockResolvedValue(SALES_SESSION);
    const res = await configPUT(putRequest("http://localhost/api/commissions/config", validSettings()));
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe("Unauthorized");
  });

  it("returns 400 for invalid data", async () => {
    mockAuth.mockResolvedValue(ADMIN_SESSION);
    const res = await configPUT(
      putRequest("http://localhost/api/commissions/config", { salesRepRate: 5 }) // rate > 1 is invalid
    );
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Invalid data");
    expect(data).toHaveProperty("details");
  });

  it("creates settings when none exist", async () => {
    mockAuth.mockResolvedValue(ADMIN_SESSION);
    const mockCreate = vi.fn().mockResolvedValue({ id: "new-s" });
    mockDb.commissionSettings = {
      findFirst: vi.fn().mockResolvedValue(null),
      create: mockCreate,
    };

    const res = await configPUT(putRequest("http://localhost/api/commissions/config", validSettings()));
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(mockCreate).toHaveBeenCalledOnce();
  });

  it("updates existing settings", async () => {
    mockAuth.mockResolvedValue(ADMIN_SESSION);
    const mockUpdate = vi.fn().mockResolvedValue({ id: "s1" });
    mockDb.commissionSettings = {
      findFirst: vi.fn().mockResolvedValue({ id: "s1" }),
      update: mockUpdate,
    };

    const res = await configPUT(putRequest("http://localhost/api/commissions/config", validSettings()));
    expect(res.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "s1" },
      data: validSettings(),
    });
  });

  it("handles database errors gracefully", async () => {
    mockAuth.mockResolvedValue(ADMIN_SESSION);
    mockDb.commissionSettings = {
      findFirst: vi.fn().mockRejectedValue(new Error("DB write error")),
    };

    await expect(
      configPUT(putRequest("http://localhost/api/commissions/config", validSettings()))
    ).rejects.toThrow("DB write error");
  });
});

// ================================================================
// POST /api/commissions/recalculate (bulk)
// ================================================================

describe("POST /api/commissions/recalculate", () => {
  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await recalculateAllPOST();
    expect(res.status).toBe(401);
  });

  it("returns 401 for non-admin users", async () => {
    mockAuth.mockResolvedValue(SALES_SESSION);
    const res = await recalculateAllPOST();
    expect(res.status).toBe(401);
  });

  it("processes all completed contracts and returns counts", async () => {
    mockAuth.mockResolvedValue(ADMIN_SESSION);
    const contracts = [{ id: "c1" }, { id: "c2" }, { id: "c3" }];
    mockDb.contract = {
      findMany: vi.fn()
        .mockResolvedValueOnce(contracts)
        .mockResolvedValueOnce([]), // second call returns empty to end loop
    };
    mockUpsertCommissionsForContract.mockResolvedValue(undefined);

    const res = await recalculateAllPOST();
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.processed).toBe(3);
    expect(data.succeeded).toBe(3);
    expect(data.failed).toBe(0);
  });

  it("counts failures when upsert throws", async () => {
    mockAuth.mockResolvedValue(ADMIN_SESSION);
    mockDb.contract = {
      findMany: vi.fn()
        .mockResolvedValueOnce([{ id: "c1" }, { id: "c2" }])
        .mockResolvedValueOnce([]),
    };
    mockUpsertCommissionsForContract
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error("calc error"));

    const res = await recalculateAllPOST();
    const data = await res.json();
    expect(data.succeeded).toBe(1);
    expect(data.failed).toBe(1);
  });

  it("handles empty contract list (no completed contracts)", async () => {
    mockAuth.mockResolvedValue(ADMIN_SESSION);
    mockDb.contract = { findMany: vi.fn().mockResolvedValue([]) };

    const res = await recalculateAllPOST();
    const data = await res.json();
    expect(data.processed).toBe(0);
    expect(data.succeeded).toBe(0);
  });
});

// ================================================================
// POST /api/commissions/recalculate/[contractId]
// ================================================================

describe("POST /api/commissions/recalculate/[contractId]", () => {
  const makeParams = (contractId: string) => ({ params: Promise.resolve({ contractId }) });

  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await recalculateSinglePOST(
      jsonRequest("http://localhost/api/commissions/recalculate/c1"),
      makeParams("c1")
    );
    expect(res.status).toBe(401);
  });

  it("returns 401 for non-admin users", async () => {
    mockAuth.mockResolvedValue(SALES_SESSION);
    const res = await recalculateSinglePOST(
      jsonRequest("http://localhost/api/commissions/recalculate/c1"),
      makeParams("c1")
    );
    expect(res.status).toBe(401);
  });

  it("returns 404 when contract not found", async () => {
    mockAuth.mockResolvedValue(ADMIN_SESSION);
    mockDb.contract = { findUnique: vi.fn().mockResolvedValue(null) };

    const res = await recalculateSinglePOST(
      jsonRequest("http://localhost/api/commissions/recalculate/missing"),
      makeParams("missing")
    );
    expect(res.status).toBe(404);
  });

  it("returns 400 when contract is not COMPLETED", async () => {
    mockAuth.mockResolvedValue(ADMIN_SESSION);
    mockDb.contract = { findUnique: vi.fn().mockResolvedValue({ id: "c1", status: "DRAFT" }) };

    const res = await recalculateSinglePOST(
      jsonRequest("http://localhost/api/commissions/recalculate/c1"),
      makeParams("c1")
    );
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("completed");
  });

  it("recalculates and returns commission records", async () => {
    mockAuth.mockResolvedValue(ADMIN_SESSION);
    mockDb.contract = {
      findUnique: vi.fn().mockResolvedValue({ id: "c1", status: "COMPLETED" }),
    };
    mockUpsertCommissionsForContract.mockResolvedValue(undefined);

    const fakeRecords = [
      { id: "r1", commissionType: "SALES_REP", amount: 500, user: { id: "u1", name: "Rep", email: "r@test.com" } },
    ];
    mockDb.commissionRecord = { findMany: vi.fn().mockResolvedValue(fakeRecords) };

    const res = await recalculateSinglePOST(
      jsonRequest("http://localhost/api/commissions/recalculate/c1"),
      makeParams("c1")
    );
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data).toHaveLength(1);
    expect(data[0].commissionType).toBe("SALES_REP");
    expect(mockUpsertCommissionsForContract).toHaveBeenCalledWith("c1", "Manual recalculation by admin");
  });
});

// ================================================================
// POST /api/commissions/preview
// ================================================================

describe("POST /api/commissions/preview", () => {
  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await previewPOST(
      jsonRequest("http://localhost/api/commissions/preview", { contractTotal: 10000, salesRepId: "s1" })
    );
    expect(res.status).toBe(401);
  });

  it("returns 400 when contractTotal is missing", async () => {
    mockAuth.mockResolvedValue(SALES_SESSION);
    const res = await previewPOST(
      jsonRequest("http://localhost/api/commissions/preview", { salesRepId: "s1" })
    );
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("required");
  });

  it("returns 400 when salesRepId is missing", async () => {
    mockAuth.mockResolvedValue(SALES_SESSION);
    const res = await previewPOST(
      jsonRequest("http://localhost/api/commissions/preview", { contractTotal: 10000 })
    );
    expect(res.status).toBe(400);
  });

  it("returns preview entries with totalCommission", async () => {
    mockAuth.mockResolvedValue(SALES_SESSION);

    mockDb.commissionSettings = { findFirst: vi.fn().mockResolvedValue(null) };
    mockDb.user = {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn().mockResolvedValue({ territoryId: null, name: "Test Rep" }),
    };
    mockDb.userCommissionOverride = { findMany: vi.fn().mockResolvedValue([]) };

    const mockEntries = [
      { userId: "s1", commissionType: "SALES_REP", contractTotal: 10000, fairPrice: 10000, rate: 0.1, amount: 1000, isBelowFair: false, isSelfGen: true },
    ];
    mockCalculateCommissionsPreview.mockReturnValue(mockEntries);

    const res = await previewPOST(
      jsonRequest("http://localhost/api/commissions/preview", {
        contractTotal: 10000,
        salesRepId: "s1",
      })
    );
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data).toHaveProperty("entries");
    expect(data).toHaveProperty("totalCommission");
    expect(data.totalCommission).toBe(1000);
    expect(data.entries).toHaveLength(1);
    expect(data.entries[0]).toHaveProperty("userName");
  });

  it("uses default settings when none exist in DB", async () => {
    mockAuth.mockResolvedValue(ADMIN_SESSION);

    mockDb.commissionSettings = { findFirst: vi.fn().mockResolvedValue(null) };
    mockDb.user = {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn().mockResolvedValue({ territoryId: null, name: "Rep" }),
    };
    mockDb.userCommissionOverride = { findMany: vi.fn().mockResolvedValue([]) };
    mockCalculateCommissionsPreview.mockReturnValue([]);

    const res = await previewPOST(
      jsonRequest("http://localhost/api/commissions/preview", {
        contractTotal: 5000,
        salesRepId: "s1",
      })
    );
    expect(res.status).toBe(200);

    // Verify calculateCommissionsPreview was called with default settings (has salesRepRate: 0.10)
    const settingsArg = mockCalculateCommissionsPreview.mock.calls[0][1];
    expect(settingsArg.salesRepRate).toBe(0.1);
  });

  it("looks up territory owners when salesRep has a territory", async () => {
    mockAuth.mockResolvedValue(ADMIN_SESSION);

    mockDb.commissionSettings = { findFirst: vi.fn().mockResolvedValue(null) };
    mockDb.user = {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn().mockResolvedValue({ territoryId: "t1", name: "Rep" }),
    };
    mockDb.userCommissionOverride = { findMany: vi.fn().mockResolvedValue([]) };
    mockCalculateCommissionsPreview.mockReturnValue([]);
    mockGetCumulativeTerritoryRevenue.mockResolvedValue(250000);

    const res = await previewPOST(
      jsonRequest("http://localhost/api/commissions/preview", {
        contractTotal: 8000,
        salesRepId: "s1",
      })
    );
    expect(res.status).toBe(200);
    expect(mockGetCumulativeTerritoryRevenue).toHaveBeenCalledWith("t1");
  });
});

// ================================================================
// GET /api/commissions/validate
// ================================================================

describe("GET /api/commissions/validate", () => {
  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await validateGET();
    expect(res.status).toBe(401);
  });

  it("returns 401 for non-admin users", async () => {
    mockAuth.mockResolvedValue(SALES_SESSION);
    const res = await validateGET();
    expect(res.status).toBe(401);
  });

  it("returns validation warnings for admin", async () => {
    mockAuth.mockResolvedValue(ADMIN_SESSION);
    const fakeResult = {
      warnings: ["No VP is configured. VP commissions will not be calculated."],
    };
    mockValidateRoleAssignments.mockResolvedValue(fakeResult);

    const res = await validateGET();
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.warnings).toHaveLength(1);
    expect(data.warnings[0]).toContain("VP");
  });

  it("returns empty warnings when everything is configured", async () => {
    mockAuth.mockResolvedValue(ADMIN_SESSION);
    mockValidateRoleAssignments.mockResolvedValue({ warnings: [] });

    const res = await validateGET();
    const data = await res.json();
    expect(data.warnings).toEqual([]);
  });

  it("handles errors from validateRoleAssignments", async () => {
    mockAuth.mockResolvedValue(ADMIN_SESSION);
    mockValidateRoleAssignments.mockRejectedValue(new Error("Validation DB error"));

    await expect(validateGET()).rejects.toThrow("Validation DB error");
  });
});

// ================================================================
// POST /api/commissions/status (bulk approve/pay)
// ================================================================

describe("POST /api/commissions/status", () => {
  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await statusPOST(
      jsonRequest("http://localhost/api/commissions/status", { ids: ["r1"], status: "APPROVED" })
    );
    expect(res.status).toBe(401);
  });

  it("returns 401 for non-admin users", async () => {
    mockAuth.mockResolvedValue(SALES_SESSION);
    const res = await statusPOST(
      jsonRequest("http://localhost/api/commissions/status", { ids: ["r1"], status: "APPROVED" })
    );
    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid request body", async () => {
    mockAuth.mockResolvedValue(ADMIN_SESSION);
    // Empty ids array
    const res = await statusPOST(
      jsonRequest("http://localhost/api/commissions/status", { ids: [], status: "APPROVED" })
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid status value", async () => {
    mockAuth.mockResolvedValue(ADMIN_SESSION);
    const res = await statusPOST(
      jsonRequest("http://localhost/api/commissions/status", { ids: ["r1"], status: "INVALID" })
    );
    expect(res.status).toBe(400);
  });

  it("approves pending records and returns counts", async () => {
    mockAuth.mockResolvedValue(ADMIN_SESSION);
    const mockTx = {
      commissionRecord: {
        findMany: vi.fn().mockResolvedValue([
          { id: "r1", status: "PENDING" },
          { id: "r2", status: "APPROVED" }, // wrong status, should be skipped
        ]),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
    };
    mockDb.$transaction = vi.fn().mockImplementation(async (fn: (tx: typeof mockTx) => Promise<unknown>) => fn(mockTx));

    const res = await statusPOST(
      jsonRequest("http://localhost/api/commissions/status", {
        ids: ["r1", "r2", "r3"],
        status: "APPROVED",
      })
    );
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.updated).toBe(1);
    expect(data.skipped).toBe(1);
    expect(data.notFound).toBe(1);
  });
});

// ================================================================
// GET /api/commissions/export
// ================================================================

describe("GET /api/commissions/export", () => {
  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await exportGET(jsonRequest("http://localhost/api/commissions/export"));
    expect(res.status).toBe(401);
  });

  it("returns 401 for non-admin users", async () => {
    mockAuth.mockResolvedValue(SALES_SESSION);
    const res = await exportGET(jsonRequest("http://localhost/api/commissions/export"));
    expect(res.status).toBe(401);
  });

  it("returns CSV with correct content type", async () => {
    mockAuth.mockResolvedValue(ADMIN_SESSION);
    const fakeRecords = [
      {
        id: "r1",
        commissionType: "SALES_REP",
        contractTotal: 10000,
        fairPrice: 10000,
        isBelowFair: false,
        isSelfGen: true,
        tierLabel: null,
        rate: 0.1,
        amount: 1000,
        status: "PENDING",
        approvedAt: null,
        paidAt: null,
        createdAt: new Date("2026-01-15"),
        contract: { contractNumber: "AWP-001", customerName: "John Doe" },
        user: { name: "Sales Rep", email: "rep@test.com" },
      },
    ];
    mockDb.commissionRecord = { findMany: vi.fn().mockResolvedValue(fakeRecords) };

    const res = await exportGET(jsonRequest("http://localhost/api/commissions/export"));
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("text/csv");
    expect(res.headers.get("Content-Disposition")).toContain("attachment");

    const csv = await res.text();
    expect(csv).toContain("Contract #");
    expect(csv).toContain("AWP-001");
    expect(csv).toContain("John Doe");
    expect(csv).toContain("Sales Rep");
  });
});

// ================================================================
// POST /api/commissions/recalculate-user
// ================================================================

describe("POST /api/commissions/recalculate-user", () => {
  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await recalculateUserPOST(
      jsonRequest("http://localhost/api/commissions/recalculate-user", { userId: "u1" })
    );
    expect(res.status).toBe(401);
  });

  it("returns 401 for non-admin users", async () => {
    mockAuth.mockResolvedValue(SALES_SESSION);
    const res = await recalculateUserPOST(
      jsonRequest("http://localhost/api/commissions/recalculate-user", { userId: "u1" })
    );
    expect(res.status).toBe(401);
  });

  it("returns 400 when userId is missing", async () => {
    mockAuth.mockResolvedValue(ADMIN_SESSION);
    const res = await recalculateUserPOST(
      jsonRequest("http://localhost/api/commissions/recalculate-user", {})
    );
    expect(res.status).toBe(400);
  });

  it("recalculates commissions for all contracts related to user", async () => {
    mockAuth.mockResolvedValue(ADMIN_SESSION);
    mockDb.contract = {
      findMany: vi.fn().mockResolvedValue([{ id: "c1" }, { id: "c2" }]),
    };
    mockUpsertCommissionsForContract.mockResolvedValue(undefined);

    const res = await recalculateUserPOST(
      jsonRequest("http://localhost/api/commissions/recalculate-user", { userId: "u1" })
    );
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.processed).toBe(2);
    expect(data.succeeded).toBe(2);
    expect(data.failed).toBe(0);
  });

  it("counts failures individually", async () => {
    mockAuth.mockResolvedValue(ADMIN_SESSION);
    mockDb.contract = {
      findMany: vi.fn().mockResolvedValue([{ id: "c1" }, { id: "c2" }]),
    };
    mockUpsertCommissionsForContract
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error("fail"));

    const res = await recalculateUserPOST(
      jsonRequest("http://localhost/api/commissions/recalculate-user", { userId: "u1" })
    );
    const data = await res.json();
    expect(data.succeeded).toBe(1);
    expect(data.failed).toBe(1);
  });
});

// ================================================================
// GET /api/commissions (list)
// ================================================================

describe("GET /api/commissions", () => {
  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await commissionsListGET(jsonRequest("http://localhost/api/commissions"));
    expect(res.status).toBe(401);
  });

  it("returns paginated records with summary for admin", async () => {
    mockAuth.mockResolvedValue(ADMIN_SESSION);

    const fakeRecords = [
      { id: "r1", amount: 500, contract: { contractNumber: "AWP-001", customerName: "Doe" }, user: { id: "u1", name: "Rep", email: "r@t.com" } },
    ];

    mockDb.commissionRecord = {
      findMany: vi.fn().mockResolvedValue(fakeRecords),
      count: vi.fn().mockResolvedValue(1),
      aggregate: vi.fn().mockResolvedValue({ _sum: { amount: 500 }, _avg: { rate: 0.1 }, _count: 1 }),
      groupBy: vi.fn().mockResolvedValue([]),
    };
    mockDb.user = { findMany: vi.fn().mockResolvedValue([]) };
    mockDb.$queryRaw = vi.fn().mockResolvedValue([]);

    const res = await commissionsListGET(jsonRequest("http://localhost/api/commissions"));
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data).toHaveProperty("records");
    expect(data).toHaveProperty("total");
    expect(data).toHaveProperty("page");
    expect(data).toHaveProperty("limit");
    expect(data).toHaveProperty("summary");
    expect(data.summary).toHaveProperty("totalCommission");
    expect(data.summary).toHaveProperty("totalContracts");
    expect(data.summary).toHaveProperty("averageRate");
    expect(data).toHaveProperty("byUser");
    expect(data).toHaveProperty("byRole");
    expect(data).toHaveProperty("byStatus");
    expect(data).toHaveProperty("monthlyTrend");
  });

  it("restricts non-admin users to their own records", async () => {
    mockAuth.mockResolvedValue(SALES_SESSION);

    mockDb.commissionRecord = {
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
      aggregate: vi.fn().mockResolvedValue({ _sum: { amount: null }, _avg: { rate: null }, _count: 0 }),
      groupBy: vi.fn().mockResolvedValue([]),
    };
    mockDb.user = { findMany: vi.fn().mockResolvedValue([]) };
    mockDb.$queryRaw = vi.fn().mockResolvedValue([]);

    await commissionsListGET(jsonRequest("http://localhost/api/commissions"));

    // Verify the where clause includes the user's ID
    const findManyCall = (mockDb.commissionRecord as { findMany: ReturnType<typeof vi.fn> }).findMany.mock.calls[0][0];
    expect(findManyCall.where.userId).toBe("sales-1");
  });
});
