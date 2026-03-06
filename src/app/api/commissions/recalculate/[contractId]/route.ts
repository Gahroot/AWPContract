import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { upsertCommissionsForContract } from "@/lib/commission";

// POST /api/commissions/recalculate/[contractId] - Recalculate commissions for a single contract
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ contractId: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { contractId } = await params;

  const contract = await db.contract.findUnique({
    where: { id: contractId },
    select: { id: true, status: true },
  });

  if (!contract) {
    return NextResponse.json({ error: "Contract not found" }, { status: 404 });
  }

  if (contract.status !== "COMPLETED") {
    return NextResponse.json(
      { error: "Only completed contracts have commissions" },
      { status: 400 }
    );
  }

  await upsertCommissionsForContract(contractId, "Manual recalculation by admin");

  const records = await db.commissionRecord.findMany({
    where: { contractId },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { commissionType: "asc" },
  });

  return NextResponse.json(records);
}
