import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";

// GET /api/commissions - List commission records with filters
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const userId = searchParams.get("userId");
  const commissionType = searchParams.get("commissionType");
  const status = searchParams.get("status");
  const groupBy = searchParams.get("groupBy");
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20")));
  const skip = (page - 1) * limit;

  const where: Prisma.CommissionRecordWhereInput = {};

  // SALESMAN can only see own records
  if (session.user.role !== "ADMIN") {
    where.userId = session.user.id;
  } else if (userId) {
    where.userId = userId;
  }

  if (commissionType) {
    where.commissionType = commissionType as Prisma.EnumCommissionTypeFilter;
  }

  if (status) {
    where.status = status as Prisma.EnumCommissionStatusFilter;
  }

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      where.createdAt.lte = end;
    }
  }

  const [records, total] = await Promise.all([
    db.commissionRecord.findMany({
      where,
      include: {
        contract: {
          select: {
            contractNumber: true,
            customerName: true,
          },
        },
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    db.commissionRecord.count({ where }),
  ]);

  // Summary aggregation
  const [aggregation, groupedByUser, groupedByType, groupedByStatus] = await Promise.all([
    db.commissionRecord.aggregate({
      where,
      _sum: { amount: true },
      _avg: { rate: true },
      _count: true,
    }),
    db.commissionRecord.groupBy({
      by: ["userId"],
      where,
      _sum: { amount: true },
      _count: true,
    }),
    db.commissionRecord.groupBy({
      by: ["commissionType"],
      where,
      _sum: { amount: true },
      _count: true,
    }),
    db.commissionRecord.groupBy({
      by: ["status"],
      where,
      _sum: { amount: true },
      _count: true,
    }),
  ]);

  const totalCommission = aggregation._sum.amount ?? 0;
  const totalContracts = aggregation._count;
  const averageRate = aggregation._avg.rate ?? 0;

  // Get user names for breakdown
  const userIds = groupedByUser.map((g) => g.userId);
  const users = await db.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, email: true },
  });

  const byUser = groupedByUser.map((g) => {
    const user = users.find((u) => u.id === g.userId);
    return {
      userId: g.userId,
      name: user?.name ?? user?.email ?? "Unknown",
      totalCommission: Math.round((g._sum.amount ?? 0) * 100) / 100,
      contractCount: g._count,
    };
  });

  const byRole = groupedByType.map((g) => ({
    commissionType: g.commissionType,
    totalCommission: Math.round((g._sum.amount ?? 0) * 100) / 100,
    count: g._count,
  }));

  const byStatus = groupedByStatus.map((g) => ({
    status: g.status,
    totalAmount: Math.round((g._sum.amount ?? 0) * 100) / 100,
    count: g._count,
  }));

  // Monthly trend - last 12 months
  let monthlyTrend: { month: string; total: number }[] = [];
  try {
    const isAdmin = session.user.role === "ADMIN";
    const uid = session.user.id;
    const trendRows = isAdmin
      ? await db.$queryRaw<{ month: Date; total: number }[]>`
          SELECT DATE_TRUNC('month', "createdAt") as month, COALESCE(SUM(amount), 0) as total
          FROM "CommissionRecord"
          WHERE "createdAt" >= NOW() - INTERVAL '12 months'
          GROUP BY DATE_TRUNC('month', "createdAt")
          ORDER BY month ASC
        `
      : await db.$queryRaw<{ month: Date; total: number }[]>`
          SELECT DATE_TRUNC('month', "createdAt") as month, COALESCE(SUM(amount), 0) as total
          FROM "CommissionRecord"
          WHERE "createdAt" >= NOW() - INTERVAL '12 months' AND "userId" = ${uid}
          GROUP BY DATE_TRUNC('month', "createdAt")
          ORDER BY month ASC
        `;
    monthlyTrend = trendRows.map((r) => ({
      month: new Date(r.month).toISOString().slice(0, 7),
      total: Math.round(Number(r.total) * 100) / 100,
    }));
  } catch {
    // Fallback if raw query fails
    monthlyTrend = [];
  }

  // Monthly breakdown (when groupBy=month)
  let monthlyBreakdown: { month: string; total: number; count: number; avgRate: number }[] = [];
  if (groupBy === "month") {
    try {
      const isAdmin = session.user.role === "ADMIN";
      const uid = session.user.id;
      const userFilter = userId ? userId : (!isAdmin ? uid : null);

      let breakdownRows: { month: Date; total: number; cnt: number; avg_rate: number }[];
      if (userFilter) {
        breakdownRows = await db.$queryRaw<{ month: Date; total: number; cnt: number; avg_rate: number }[]>`
          SELECT DATE_TRUNC('month', "createdAt") as month,
                 COALESCE(SUM(amount), 0) as total,
                 COUNT(*)::int as cnt,
                 COALESCE(AVG(rate), 0) as avg_rate
          FROM "CommissionRecord"
          WHERE "userId" = ${userFilter}
          ${startDate ? db.$queryRaw`AND "createdAt" >= ${new Date(startDate)}` : db.$queryRaw``}
          ${endDate ? db.$queryRaw`AND "createdAt" <= ${new Date(endDate + "T23:59:59.999Z")}` : db.$queryRaw``}
          GROUP BY DATE_TRUNC('month', "createdAt")
          ORDER BY month DESC
        `;
      } else {
        breakdownRows = await db.$queryRaw<{ month: Date; total: number; cnt: number; avg_rate: number }[]>`
          SELECT DATE_TRUNC('month', "createdAt") as month,
                 COALESCE(SUM(amount), 0) as total,
                 COUNT(*)::int as cnt,
                 COALESCE(AVG(rate), 0) as avg_rate
          FROM "CommissionRecord"
          GROUP BY DATE_TRUNC('month', "createdAt")
          ORDER BY month DESC
        `;
      }

      monthlyBreakdown = breakdownRows.map((r) => ({
        month: new Date(r.month).toLocaleDateString("en-US", { month: "long", year: "numeric" }),
        total: Math.round(Number(r.total) * 100) / 100,
        count: Number(r.cnt),
        avgRate: Math.round(Number(r.avg_rate) * 10000) / 10000,
      }));
    } catch {
      monthlyBreakdown = [];
    }
  }

  return NextResponse.json({
    records,
    total,
    page,
    limit,
    summary: {
      totalCommission: Math.round(totalCommission * 100) / 100,
      totalContracts,
      averageRate: Math.round(averageRate * 10000) / 10000,
    },
    byUser,
    byRole,
    byStatus,
    monthlyTrend,
    monthlyBreakdown,
  });
}
