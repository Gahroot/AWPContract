import { db } from "@/lib/db";
import type { CommissionType, CommissionSettings } from "@/generated/prisma/client";

// ─── Types ──────────────────────────────────────────────────

export interface CommissionEntry {
  userId: string;
  commissionType: CommissionType;
  contractTotal: number;
  fairPrice: number;
  rate: number;
  amount: number;
  isBelowFair: boolean;
  isSelfGen: boolean;
  tierLabel?: string;
  notes?: string;
}

export interface CommissionContext {
  contractId: string;
  contractTotal: number;
  fairPrice: number;
  salesRepId: string;
  setterId: string | null;
}

export interface CommissionOverrideMap {
  [key: string]: number; // key = `${userId}:${commissionType}`
}

interface ManagementUsers {
  setterManagers: { id: string }[];
  territoryOwners: { id: string }[];
  vps: { id: string }[];
  nsms: { id: string }[];
  salesRepTerritoryId: string | null;
  cumulativeRevenue: number;
}

// ─── Helpers ────────────────────────────────────────────────

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

export function isBelowFair(contractTotal: number, fairPrice: number): boolean {
  return contractTotal < fairPrice;
}

export function isSelfGen(salesRepId: string, setterId: string | null): boolean {
  return setterId == null || setterId === salesRepId;
}

export function meetsFloor(contractTotal: number, fairPrice: number, floor: number): boolean {
  return contractTotal >= fairPrice * floor;
}

export function commissionableRevenue(contractTotal: number, fairPrice: number, ceiling: number): number {
  return Math.min(contractTotal, fairPrice * ceiling);
}

function overrideKey(userId: string, type: CommissionType): string {
  return `${userId}:${type}`;
}

// ─── Default settings (used when no DB row exists) ──────────

const DEFAULT_SETTINGS: Omit<CommissionSettings, "id" | "createdAt" | "updatedAt"> = {
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

// ─── Pure preview function (no DB writes) ───────────────────

export function calculateCommissionsPreview(
  ctx: CommissionContext,
  s: Omit<CommissionSettings, "id" | "createdAt" | "updatedAt">,
  mgmt: ManagementUsers,
  overrides: CommissionOverrideMap = {}
): CommissionEntry[] {
  const entries: CommissionEntry[] = [];

  if (ctx.contractTotal <= 0 || !ctx.salesRepId) return entries;

  const selfGen = isSelfGen(ctx.salesRepId, ctx.setterId);
  const belowFair = isBelowFair(ctx.contractTotal, ctx.fairPrice);

  // Helper to apply override
  function applyOverride(userId: string, type: CommissionType, defaultRate: number): { rate: number; notes?: string } {
    const key = overrideKey(userId, type);
    if (overrides[key] !== undefined) {
      return { rate: overrides[key], notes: "Custom rate override" };
    }
    return { rate: defaultRate };
  }

  // 1. Sales Rep / Traditional Sales Rep
  {
    const floorVal = selfGen ? s.traditionalFloorRate : s.salesRepFloor;
    const ceilingVal = selfGen ? s.traditionalPriceCeiling : s.salesRepCeiling;

    if (meetsFloor(ctx.contractTotal, ctx.fairPrice, floorVal)) {
      const defaultRate = selfGen
        ? (belowFair ? s.traditionalSalesRepRateBelowFair : s.traditionalSalesRepRate)
        : (belowFair ? s.salesRepRateBelowFair : s.salesRepRate);
      const { rate, notes } = applyOverride(ctx.salesRepId, "SALES_REP", defaultRate);
      const revenue = commissionableRevenue(ctx.contractTotal, ctx.fairPrice, ceilingVal);
      const amount = round(revenue * rate);

      entries.push({
        userId: ctx.salesRepId,
        commissionType: "SALES_REP",
        contractTotal: ctx.contractTotal,
        fairPrice: ctx.fairPrice,
        rate,
        amount,
        isBelowFair: belowFair,
        isSelfGen: selfGen,
        tierLabel: selfGen ? "Traditional" : undefined,
        notes,
      });
    }
  }

  // 2. Setter (only if setter-set, not self-gen)
  if (!selfGen && ctx.setterId) {
    if (meetsFloor(ctx.contractTotal, ctx.fairPrice, s.setterFloor)) {
      const { rate, notes } = applyOverride(ctx.setterId, "SETTER", s.setterRate);
      const amount = round(ctx.contractTotal * rate);

      entries.push({
        userId: ctx.setterId,
        commissionType: "SETTER",
        contractTotal: ctx.contractTotal,
        fairPrice: ctx.fairPrice,
        rate,
        amount,
        isBelowFair: belowFair,
        isSelfGen: false,
        notes,
      });
    }
  }

  // 3. Setter Manager Override
  for (const mgr of mgmt.setterManagers) {
    const defaultRate = belowFair ? s.setterManagerRateBelowFair : s.setterManagerRate;
    const { rate, notes } = applyOverride(mgr.id, "SETTER_MANAGER", defaultRate);
    const amount = round(ctx.contractTotal * rate);
    entries.push({
      userId: mgr.id,
      commissionType: "SETTER_MANAGER",
      contractTotal: ctx.contractTotal,
      fairPrice: ctx.fairPrice,
      rate,
      amount,
      isBelowFair: belowFair,
      isSelfGen: selfGen,
      notes,
    });
  }

  // 4. Territory Owner Override (tiered by cumulative territory revenue)
  if (mgmt.salesRepTerritoryId && mgmt.territoryOwners.length > 0) {
    const cumulative = mgmt.cumulativeRevenue;
    let defaultRate: number;
    let tierLabel: string;

    if (cumulative >= s.territoryOwnerTier3Threshold) {
      defaultRate = s.territoryOwnerRateTier3;
      tierLabel = "Tier 3";
    } else if (cumulative >= s.territoryOwnerTier2Threshold) {
      defaultRate = s.territoryOwnerRateTier2;
      tierLabel = "Tier 2";
    } else {
      defaultRate = s.territoryOwnerRateTier1;
      tierLabel = "Tier 1";
    }

    for (const owner of mgmt.territoryOwners) {
      const { rate, notes } = applyOverride(owner.id, "TERRITORY_OWNER", defaultRate);
      const amount = round(ctx.contractTotal * rate);
      entries.push({
        userId: owner.id,
        commissionType: "TERRITORY_OWNER",
        contractTotal: ctx.contractTotal,
        fairPrice: ctx.fairPrice,
        rate,
        amount,
        isBelowFair: belowFair,
        isSelfGen: selfGen,
        tierLabel,
        notes,
      });
    }
  }

  // 5. VP Override
  for (const vp of mgmt.vps) {
    const defaultRate = belowFair ? s.vpRateBelowFair : s.vpRate;
    const { rate, notes } = applyOverride(vp.id, "VP", defaultRate);
    const amount = round(ctx.contractTotal * rate);
    entries.push({
      userId: vp.id,
      commissionType: "VP",
      contractTotal: ctx.contractTotal,
      fairPrice: ctx.fairPrice,
      rate,
      amount,
      isBelowFair: belowFair,
      isSelfGen: selfGen,
      notes,
    });
  }

  // 6. NSM Override
  for (const nsm of mgmt.nsms) {
    const defaultRate = selfGen
      ? (belowFair ? s.traditionalNsmOverrideRateBelowFair : s.traditionalNsmOverrideRate)
      : (belowFair ? s.nsmRateBelowFair : s.nsmRate);
    const { rate, notes } = applyOverride(nsm.id, "NSM", defaultRate);
    const amount = round(ctx.contractTotal * rate);
    entries.push({
      userId: nsm.id,
      commissionType: "NSM",
      contractTotal: ctx.contractTotal,
      fairPrice: ctx.fairPrice,
      rate,
      amount,
      isBelowFair: belowFair,
      isSelfGen: selfGen,
      notes,
    });
  }

  return entries;
}

// ─── Main calculation (loads DB data then delegates to preview) ──

export async function calculateAllCommissions(
  ctx: CommissionContext,
  settings?: Omit<CommissionSettings, "id" | "createdAt" | "updatedAt">
): Promise<CommissionEntry[]> {
  if (ctx.contractTotal <= 0 || !ctx.salesRepId) return [];

  const s = settings ?? (await db.commissionSettings.findFirst()) ?? DEFAULT_SETTINGS;

  // Load management users
  const [setterManagers, salesRep, vps, nsms, allOverrides] = await Promise.all([
    db.user.findMany({ where: { isSetterManager: true }, select: { id: true } }),
    db.user.findUnique({ where: { id: ctx.salesRepId }, select: { territoryId: true } }),
    db.user.findMany({ where: { isVP: true }, select: { id: true } }),
    db.user.findMany({ where: { isNSM: true }, select: { id: true } }),
    db.userCommissionOverride.findMany({ where: { isActive: true } }),
  ]);

  const territoryId = salesRep?.territoryId ?? null;

  let territoryOwners: { id: string }[] = [];
  let cumulativeRevenue = 0;

  if (territoryId) {
    [territoryOwners, cumulativeRevenue] = await Promise.all([
      db.user.findMany({ where: { isTerritoryOwner: true, territoryId }, select: { id: true } }),
      getCumulativeTerritoryRevenue(territoryId, ctx.contractId),
    ]);
  }

  // Build override map
  const overrides: CommissionOverrideMap = {};
  for (const o of allOverrides) {
    overrides[overrideKey(o.userId, o.commissionType)] = o.rateOverride;
  }

  const mgmt: ManagementUsers = {
    setterManagers,
    territoryOwners,
    vps,
    nsms,
    salesRepTerritoryId: territoryId,
    cumulativeRevenue,
  };

  return calculateCommissionsPreview(ctx, s, mgmt, overrides);
}

// ─── Territory revenue helper ───────────────────────────────

export async function getCumulativeTerritoryRevenue(
  territoryId: string,
  excludeContractId?: string
): Promise<number> {
  const yearStart = new Date(new Date().getFullYear(), 0, 1);

  const where: Record<string, unknown> = {
    status: "COMPLETED",
    createdAt: { gte: yearStart },
    salesRep: {
      territoryId,
    },
  };
  if (excludeContractId) {
    where.id = { not: excludeContractId };
  }

  const result = await db.contract.aggregate({
    where: where as never,
    _sum: { contractTotal: true },
  });

  return result._sum.contractTotal ?? 0;
}

// ─── Upsert commissions for a contract ──────────────────────

export async function upsertCommissionsForContract(
  contractId: string,
  notes?: string
): Promise<void> {
  const contract = await db.contract.findUnique({
    where: { id: contractId },
    select: {
      id: true,
      status: true,
      contractTotal: true,
      total: true,
      userId: true,
      salesRepId: true,
      setterId: true,
    },
  });

  if (!contract) return;
  if (contract.status !== "COMPLETED") return;

  const salesRepId = contract.salesRepId ?? contract.userId;
  if (!salesRepId) return;

  const ctx: CommissionContext = {
    contractId,
    contractTotal: contract.contractTotal,
    fairPrice: contract.total, // pre-discount total = fair price
    salesRepId,
    setterId: contract.setterId,
  };

  const entries = await calculateAllCommissions(ctx);

  // Delete existing and create new in transaction
  await db.$transaction(async (tx) => {
    await tx.commissionRecord.deleteMany({ where: { contractId } });

    if (entries.length > 0) {
      await tx.commissionRecord.createMany({
        data: entries.map((e) => ({
          contractId,
          userId: e.userId,
          commissionType: e.commissionType,
          contractTotal: e.contractTotal,
          fairPrice: e.fairPrice,
          isBelowFair: e.isBelowFair,
          isSelfGen: e.isSelfGen,
          rate: e.rate,
          amount: e.amount,
          tierLabel: e.tierLabel ?? null,
          notes: notes ?? e.notes ?? null,
        })),
      });
    }
  });
}
