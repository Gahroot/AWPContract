import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { upsertCommissionForContract } from "@/lib/commission";

// POST /api/commissions/recalculate - Recalculate all commissions
export async function POST() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contracts = await db.contract.findMany({
    where: { status: "COMPLETED", userId: { not: null } },
    select: { id: true },
  });

  let success = 0;
  let failed = 0;

  for (const contract of contracts) {
    try {
      await upsertCommissionForContract(
        contract.id,
        "Bulk recalculation after config change"
      );
      success++;
    } catch (e) {
      console.error(`Commission recalc failed for ${contract.id}:`, e);
      failed++;
    }
  }

  return NextResponse.json({
    success: true,
    processed: contracts.length,
    succeeded: success,
    failed,
  });
}
