import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  db: {
    user: {
      count: vi.fn(),
    },
    territory: {
      findMany: vi.fn(),
    },
  },
}));

import { validateRoleAssignments } from "../commission-validation";
import { db } from "@/lib/db";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockDb = db as any;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("validateRoleAssignments", () => {
  it("returns no warnings when all roles are assigned and territories have owners", async () => {
    mockDb.user.count.mockImplementation(
      ({ where }: { where: Record<string, boolean> }) => {
        if (where.isNSM) return Promise.resolve(1);
        if (where.isVP) return Promise.resolve(1);
        if (where.isSetterManager) return Promise.resolve(1);
        return Promise.resolve(0);
      }
    );
    mockDb.territory.findMany.mockResolvedValue([
      { id: "t1", name: "West", users: [{ id: "u1" }], _count: { users: 2 } },
    ]);

    const result = await validateRoleAssignments();

    expect(result).toEqual({ warnings: [] });
  });

  it("warns when no NSM is configured", async () => {
    mockDb.user.count.mockImplementation(
      ({ where }: { where: Record<string, boolean> }) => {
        if (where.isNSM) return Promise.resolve(0);
        if (where.isVP) return Promise.resolve(1);
        if (where.isSetterManager) return Promise.resolve(1);
        return Promise.resolve(0);
      }
    );
    mockDb.territory.findMany.mockResolvedValue([]);

    const result = await validateRoleAssignments();

    expect(result.warnings).toContainEqual(
      expect.stringContaining("National Sales Manager")
    );
  });

  it("warns when no VP is configured", async () => {
    mockDb.user.count.mockImplementation(
      ({ where }: { where: Record<string, boolean> }) => {
        if (where.isNSM) return Promise.resolve(1);
        if (where.isVP) return Promise.resolve(0);
        if (where.isSetterManager) return Promise.resolve(1);
        return Promise.resolve(0);
      }
    );
    mockDb.territory.findMany.mockResolvedValue([]);

    const result = await validateRoleAssignments();

    expect(result.warnings).toContainEqual(expect.stringContaining("VP"));
  });

  it("warns when no setter manager is configured", async () => {
    mockDb.user.count.mockImplementation(
      ({ where }: { where: Record<string, boolean> }) => {
        if (where.isNSM) return Promise.resolve(1);
        if (where.isVP) return Promise.resolve(1);
        if (where.isSetterManager) return Promise.resolve(0);
        return Promise.resolve(0);
      }
    );
    mockDb.territory.findMany.mockResolvedValue([]);

    const result = await validateRoleAssignments();

    expect(result.warnings).toContainEqual(
      expect.stringContaining("Setter Manager")
    );
  });

  it("warns when an active territory has no territory owner", async () => {
    mockDb.user.count.mockImplementation(() => Promise.resolve(1));
    mockDb.territory.findMany.mockImplementation(
      ({ where }: { where: Record<string, unknown> }) => {
        // First call: active territories with owners included
        if (!where.users) {
          return Promise.resolve([
            { id: "t1", name: "East Region", users: [] },
          ]);
        }
        // Second call: territories with users but no owner
        return Promise.resolve([]);
      }
    );

    const result = await validateRoleAssignments();

    expect(result.warnings).toContainEqual(
      expect.stringContaining("no territory owner")
    );
  });

  it("warns when a territory has users but no territory owner", async () => {
    mockDb.user.count.mockImplementation(() => Promise.resolve(1));
    mockDb.territory.findMany.mockImplementation(
      ({ where }: { where: Record<string, unknown> }) => {
        if (!where.users) {
          return Promise.resolve([
            { id: "t1", name: "South", users: [{ id: "owner1" }] },
          ]);
        }
        // Territory with users but no territory owner
        return Promise.resolve([
          {
            id: "t2",
            name: "North",
            users: [],
            _count: { users: 3 },
          },
        ]);
      }
    );

    const result = await validateRoleAssignments();

    expect(result.warnings).toContainEqual(
      expect.stringContaining("3 user(s) but no territory owner")
    );
  });

  it("returns multiple warnings simultaneously when no NSM, VP, or setter manager", async () => {
    mockDb.user.count.mockResolvedValue(0);
    mockDb.territory.findMany.mockResolvedValue([]);

    const result = await validateRoleAssignments();

    expect(result.warnings.length).toBeGreaterThanOrEqual(3);
    expect(result.warnings).toContainEqual(
      expect.stringContaining("National Sales Manager")
    );
    expect(result.warnings).toContainEqual(expect.stringContaining("VP"));
    expect(result.warnings).toContainEqual(
      expect.stringContaining("Setter Manager")
    );
  });

  it("does not warn for a territory that has a territory owner", async () => {
    mockDb.user.count.mockImplementation(() => Promise.resolve(1));
    mockDb.territory.findMany.mockResolvedValue([
      { id: "t1", name: "West", users: [{ id: "owner1" }], _count: { users: 2 } },
    ]);

    const result = await validateRoleAssignments();

    expect(result.warnings).toEqual([]);
  });

  it("does not warn for inactive territories without owners", async () => {
    mockDb.user.count.mockImplementation(() => Promise.resolve(1));
    // findMany filters by isActive: true, so inactive territories are never returned
    mockDb.territory.findMany.mockResolvedValue([]);

    const result = await validateRoleAssignments();

    expect(result.warnings).toEqual([]);
  });

  it("warns only for territories missing owners when some have owners and some do not", async () => {
    mockDb.user.count.mockImplementation(() => Promise.resolve(1));
    mockDb.territory.findMany.mockImplementation(
      ({ where }: { where: Record<string, unknown> }) => {
        if (!where.users) {
          return Promise.resolve([
            { id: "t1", name: "West", users: [{ id: "owner1" }] },
            { id: "t2", name: "East", users: [] },
            { id: "t3", name: "Central", users: [] },
          ]);
        }
        return Promise.resolve([]);
      }
    );

    const result = await validateRoleAssignments();

    expect(result.warnings).not.toContainEqual(
      expect.stringContaining("West")
    );
    expect(result.warnings).toContainEqual(
      expect.stringContaining("East")
    );
    expect(result.warnings).toContainEqual(
      expect.stringContaining("Central")
    );
  });

  it("includes the territory name in warning messages", async () => {
    mockDb.user.count.mockImplementation(() => Promise.resolve(1));
    mockDb.territory.findMany.mockImplementation(
      ({ where }: { where: Record<string, unknown> }) => {
        if (!where.users) {
          return Promise.resolve([
            { id: "t1", name: "Mountain West", users: [] },
          ]);
        }
        return Promise.resolve([]);
      }
    );

    const result = await validateRoleAssignments();

    expect(result.warnings).toContainEqual(
      expect.stringContaining("Mountain West")
    );
  });

  it("returns an object with a warnings array", async () => {
    mockDb.user.count.mockResolvedValue(1);
    mockDb.territory.findMany.mockResolvedValue([]);

    const result = await validateRoleAssignments();

    expect(result).toHaveProperty("warnings");
    expect(Array.isArray(result.warnings)).toBe(true);
  });

  it("warns for NSM, VP, and setter manager when database is empty", async () => {
    mockDb.user.count.mockResolvedValue(0);
    mockDb.territory.findMany.mockResolvedValue([]);

    const result = await validateRoleAssignments();

    expect(result.warnings).toContainEqual(
      expect.stringContaining("NSM")
    );
    expect(result.warnings).toContainEqual(
      expect.stringContaining("VP")
    );
    expect(result.warnings).toContainEqual(
      expect.stringContaining("Setter Manager")
    );
  });
});
