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

  const BATCH_SIZE = 10;
  for (let i = 0; i < contracts.length; i += BATCH_SIZE) {
    const batch = contracts.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map(c => upsertCommissionForContract(c.id, "Bulk recalculation after config change"))
    );
    for (const r of results) {
      if (r.status === "fulfilled") success++;
      else { failed++; console.error("Commission recalc failed:", r.reason); }
    }
  }

  return NextResponse.json({
    success: true,
    processed: contracts.length,
    succeeded: success,
    failed,
  });
}
