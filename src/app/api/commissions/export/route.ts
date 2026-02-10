import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";

// GET /api/commissions/export - Export commissions as CSV
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const userId = searchParams.get("userId");

  const where: Prisma.CommissionRecordWhereInput = {};
  if (userId) where.userId = userId;
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      where.createdAt.lte = end;
    }
  }

  const records = await db.commissionRecord.findMany({
    where,
    include: {
      contract: {
        select: { contractNumber: true, customerName: true },
      },
      user: {
        select: { name: true, email: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Build CSV
  const header =
    "Contract #,Customer,Salesperson,Contract Total,Model,Rate %,Commission Amount,Date";
  const rows = records.map((r) => {
    const salesperson = r.user.name ?? r.user.email;
    const date = r.createdAt.toISOString().split("T")[0];
    const ratePercent = (r.rate * 100).toFixed(2);
    return [
      csvEscape(r.contract.contractNumber),
      csvEscape(r.contract.customerName ?? ""),
      csvEscape(salesperson),
      r.contractTotal.toFixed(2),
      r.modelType,
      ratePercent,
      r.amount.toFixed(2),
      date,
    ].join(",");
  });

  const csv = [header, ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="commissions-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}

function csvEscape(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
