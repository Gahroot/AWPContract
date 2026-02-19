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

  let success = 0;
  let failed = 0;
  let total = 0;
  const PAGE_SIZE = 100;
  const BATCH_SIZE = 10;
  let cursor: string | undefined;

  for (;;) {
    const contracts = await db.contract.findMany({
      where: { status: "COMPLETED", userId: { not: null } },
      select: { id: true },
      take: PAGE_SIZE,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { id: "asc" },
    });

    if (contracts.length === 0) break;
    total += contracts.length;
    cursor = contracts[contracts.length - 1].id;

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
  }

  return NextResponse.json({
    success: true,
    processed: total,
    succeeded: success,
    failed,
  });
}
