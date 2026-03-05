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

// ─── Main calculation ───────────────────────────────────────

export async function calculateAllCommissions(
  ctx: CommissionContext,
  settings?: Omit<CommissionSettings, "id" | "createdAt" | "updatedAt">
): Promise<CommissionEntry[]> {
  const entries: CommissionEntry[] = [];

  if (ctx.contractTotal <= 0 || !ctx.salesRepId) return entries;

  const s = settings ?? (await db.commissionSettings.findFirst()) ?? DEFAULT_SETTINGS;
  const selfGen = isSelfGen(ctx.salesRepId, ctx.setterId);
  const belowFair = isBelowFair(ctx.contractTotal, ctx.fairPrice);

  // 1. Sales Rep / Traditional Sales Rep
  {
    const floorVal = selfGen ? s.traditionalFloorRate : s.salesRepFloor;
    const ceilingVal = selfGen ? s.traditionalPriceCeiling : s.salesRepCeiling;

    if (meetsFloor(ctx.contractTotal, ctx.fairPrice, floorVal)) {
      const rate = selfGen
        ? (belowFair ? s.traditionalSalesRepRateBelowFair : s.traditionalSalesRepRate)
        : (belowFair ? s.salesRepRateBelowFair : s.salesRepRate);
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
      });
    }
  }

  // 2. Setter (only if setter-set, not self-gen)
  if (!selfGen && ctx.setterId) {
    if (meetsFloor(ctx.contractTotal, ctx.fairPrice, s.setterFloor)) {
      const rate = s.setterRate;
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
      });
    }
  }

  // 3. Setter Manager Override
  const setterManagers = await db.user.findMany({
    where: { isSetterManager: true },
    select: { id: true },
  });
  for (const mgr of setterManagers) {
    const rate = belowFair ? s.setterManagerRateBelowFair : s.setterManagerRate;
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
    });
  }

  // 4. Territory Owner Override (tiered by cumulative territory revenue)
  const salesRep = await db.user.findUnique({
    where: { id: ctx.salesRepId },
    select: { territory: true, market: true },
  });
  const territory = salesRep?.territory ?? salesRep?.market ?? null;

  if (territory) {
    const owners = await db.user.findMany({
      where: {
        isTerritoryOwner: true,
        OR: [{ territory }, { market: territory }],
      },
      select: { id: true },
    });

    if (owners.length > 0) {
      const cumulative = await getCumulativeTerritoryRevenue(territory, ctx.contractId);
      let rate: number;
      let tierLabel: string;

      if (cumulative >= s.territoryOwnerTier3Threshold) {
        rate = s.territoryOwnerRateTier3;
        tierLabel = "Tier 3";
      } else if (cumulative >= s.territoryOwnerTier2Threshold) {
        rate = s.territoryOwnerRateTier2;
        tierLabel = "Tier 2";
      } else {
        rate = s.territoryOwnerRateTier1;
        tierLabel = "Tier 1";
      }

      const amount = round(ctx.contractTotal * rate);
      for (const owner of owners) {
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
        });
      }
    }
  }

  // 5. VP Override
  const vps = await db.user.findMany({
    where: { isVP: true },
    select: { id: true },
  });
  for (const vp of vps) {
    const rate = belowFair ? s.vpRateBelowFair : s.vpRate;
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
    });
  }

  // 6. NSM Override
  const nsms = await db.user.findMany({
    where: { isNSM: true },
    select: { id: true },
  });
  for (const nsm of nsms) {
    const rate = selfGen
      ? (belowFair ? s.traditionalNsmOverrideRateBelowFair : s.traditionalNsmOverrideRate)
      : (belowFair ? s.nsmRateBelowFair : s.nsmRate);
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
    });
  }

  return entries;
}

// ─── Territory revenue helper ───────────────────────────────

export async function getCumulativeTerritoryRevenue(
  territory: string,
  excludeContractId?: string
): Promise<number> {
  const yearStart = new Date(new Date().getFullYear(), 0, 1);

  const where: Record<string, unknown> = {
    status: "COMPLETED",
    createdAt: { gte: yearStart },
    salesRep: {
      OR: [{ territory }, { market: territory }],
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
