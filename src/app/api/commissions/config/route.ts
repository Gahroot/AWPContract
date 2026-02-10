import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { commissionConfigSchema } from "@/lib/validations";

// GET /api/commissions/config - Get commission configuration
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const config = await db.commissionConfig.findFirst({
    orderBy: { updatedAt: "desc" },
  });

  const tiers = await db.commissionTier.findMany({
    orderBy: { sortOrder: "asc" },
  });

  const rates = await db.commissionRate.findMany({
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  return NextResponse.json({
    config: config ?? { modelType: "FLAT_PERCENT", flatRate: 0.1 },
    tiers,
    salespersonRates: rates,
  });
}

// PUT /api/commissions/config - Update commission configuration
export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = commissionConfigSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid data", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { modelType, flatRate, tiers, salespersonRates } = parsed.data;

  // Upsert config (single row)
  const existing = await db.commissionConfig.findFirst();
  if (existing) {
    await db.commissionConfig.update({
      where: { id: existing.id },
      data: { modelType, flatRate: flatRate ?? null },
    });
  } else {
    await db.commissionConfig.create({
      data: { modelType, flatRate: flatRate ?? null },
    });
  }

  // Replace tiers
  if (tiers !== undefined) {
    await db.commissionTier.deleteMany();
    if (tiers.length > 0) {
      await db.commissionTier.createMany({ data: tiers });
    }
  }

  // Upsert per-salesperson rates
  if (salespersonRates !== undefined) {
    for (const sr of salespersonRates) {
      await db.commissionRate.upsert({
        where: { userId: sr.userId },
        update: { rate: sr.rate },
        create: { userId: sr.userId, rate: sr.rate },
      });
    }
    // Remove rates for users not in the list
    const keepUserIds = salespersonRates.map((sr) => sr.userId);
    if (keepUserIds.length > 0) {
      await db.commissionRate.deleteMany({
        where: { userId: { notIn: keepUserIds } },
      });
    } else {
      await db.commissionRate.deleteMany();
    }
  }

  return NextResponse.json({ success: true });
}
