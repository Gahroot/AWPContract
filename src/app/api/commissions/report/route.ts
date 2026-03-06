import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";

// GET /api/commissions/report - Generate commission report PDF
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const userId = searchParams.get("userId");
  const status = searchParams.get("status");

  if (!startDate || !endDate) {
    return NextResponse.json(
      { error: "startDate and endDate are required" },
      { status: 400 }
    );
  }

  const where: Prisma.CommissionRecordWhereInput = {};
  if (userId) where.userId = userId;
  if (status) where.status = status as Prisma.EnumCommissionStatusFilter;
  where.createdAt = {
    gte: new Date(startDate),
    lte: (() => {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      return end;
    })(),
  };

  const records = await db.commissionRecord.findMany({
    where,
    include: {
      contract: {
        select: { contractNumber: true, customerName: true },
      },
      user: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  // Group by status for summary
  const statusSummary = await db.commissionRecord.groupBy({
    by: ["status"],
    where,
    _sum: { amount: true },
    _count: true,
  });

  // Group by user for per-user summary
  const userSummary = await db.commissionRecord.groupBy({
    by: ["userId"],
    where,
    _sum: { amount: true },
    _count: true,
  });

  const userIds = userSummary.map((u) => u.userId);
  const users = await db.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, email: true },
  });

  const perUser = userSummary.map((u) => {
    const user = users.find((usr) => usr.id === u.userId);
    return {
      name: user?.name ?? user?.email ?? "Unknown",
      totalAmount: Math.round((u._sum.amount ?? 0) * 100) / 100,
      recordCount: u._count,
    };
  });

  const totalAmount = records.reduce((sum, r) => sum + r.amount, 0);

  const reportData = {
    startDate,
    endDate,
    totalAmount: Math.round(totalAmount * 100) / 100,
    totalRecords: records.length,
    statusSummary: statusSummary.map((s) => ({
      status: s.status,
      amount: Math.round((s._sum.amount ?? 0) * 100) / 100,
      count: s._count,
    })),
    perUser,
    records: records.map((r) => ({
      contractNumber: r.contract.contractNumber,
      customerName: r.contract.customerName,
      recipientName: r.user.name ?? r.user.email,
      commissionType: r.commissionType,
      rate: r.rate,
      amount: r.amount,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
    })),
  };

  const { generateCommissionReportPdf } = await import("@/lib/pdf");
  const pdfBuffer = await generateCommissionReportPdf(reportData);

  return new NextResponse(Buffer.from(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="commission-report-${startDate}-${endDate}.pdf"`,
    },
  });
}
