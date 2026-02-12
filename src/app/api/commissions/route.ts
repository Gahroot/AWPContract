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
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20")));
  const skip = (page - 1) * limit;

  // Build where clause
  const where: Prisma.CommissionRecordWhereInput = {};

  // SALESMAN can only see own records
  if (session.user.role !== "ADMIN") {
    where.userId = session.user.id;
  } else if (userId) {
    where.userId = userId;
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

  // Summary aggregation using DB queries instead of fetching all records
  const [aggregation, groupedByUser] = await Promise.all([
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
  });
}
