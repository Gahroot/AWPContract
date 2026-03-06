import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  calculateCommissionsPreview,
  getCumulativeTerritoryRevenue,
  type CommissionContext,
  type CommissionOverrideMap,
} from "@/lib/commission";

// POST /api/commissions/preview - Preview commission calculation without persisting
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const { contractTotal, fairPrice, salesRepId, setterId } = body;

  if (!contractTotal || !salesRepId) {
    return NextResponse.json(
      { error: "contractTotal and salesRepId are required" },
      { status: 400 }
    );
  }

  const ctx: CommissionContext = {
    contractId: "preview",
    contractTotal: Number(contractTotal),
    fairPrice: Number(fairPrice ?? contractTotal),
    salesRepId,
    setterId: setterId || null,
  };

  // Load settings, management users, and overrides
  const s = (await db.commissionSettings.findFirst()) ?? undefined;
  const DEFAULT_SETTINGS = {
    salesRepRate: 0.10, salesRepRateBelowFair: 0.05, salesRepFloor: 0.85, salesRepCeiling: 1.15,
    setterRate: 0.03, setterFloor: 0.85,
    setterManagerRate: 0.02, setterManagerRateBelowFair: 0.01,
    territoryOwnerRateTier1: 0.01, territoryOwnerRateTier2: 0.015, territoryOwnerRateTier3: 0.02,
    territoryOwnerTier2Threshold: 500000, territoryOwnerTier3Threshold: 1000000,
    vpRate: 0.01, vpRateBelowFair: 0.005,
    nsmRate: 0.005, nsmRateBelowFair: 0.0025,
    traditionalSalesRepRate: 0.12, traditionalSalesRepRateBelowFair: 0.07,
    traditionalFloorRate: 0.85, traditionalPriceCeiling: 1.15,
    traditionalNsmOverrideRate: 0.005, traditionalNsmOverrideRateBelowFair: 0.0025,
  };
  const settings = s ?? DEFAULT_SETTINGS;

  const [setterManagers, salesRep, vps, nsms, allOverrides] = await Promise.all([
    db.user.findMany({ where: { isSetterManager: true }, select: { id: true } }),
    db.user.findUnique({ where: { id: salesRepId }, select: { territoryId: true, name: true } }),
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
      getCumulativeTerritoryRevenue(territoryId),
    ]);
  }

  const overrides: CommissionOverrideMap = {};
  for (const o of allOverrides) {
    overrides[`${o.userId}:${o.commissionType}`] = o.rateOverride;
  }

  const entries = calculateCommissionsPreview(ctx, settings, {
    setterManagers,
    territoryOwners,
    vps,
    nsms,
    salesRepTerritoryId: territoryId,
    cumulativeRevenue,
  }, overrides);

  // Load user names for display
  const userIds = [...new Set(entries.map((e) => e.userId))];
  const users = userIds.length > 0
    ? await db.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, email: true },
      })
    : [];

  const enrichedEntries = entries.map((e) => {
    const user = users.find((u) => u.id === e.userId);
    return { ...e, userName: user?.name ?? user?.email ?? "Unknown" };
  });

  const totalCommission = entries.reduce((sum, e) => sum + e.amount, 0);

  return NextResponse.json({ entries: enrichedEntries, totalCommission });
}
