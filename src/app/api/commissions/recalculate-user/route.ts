import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { upsertCommissionsForContract } from "@/lib/commission";

// POST /api/commissions/recalculate-user - Recalculate commissions for a specific user
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const { userId } = body;
  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  const contracts = await db.contract.findMany({
    where: {
      status: "COMPLETED",
      OR: [
        { salesRepId: userId },
        { setterId: userId },
        { userId },
      ],
    },
    select: { id: true },
  });

  let succeeded = 0;
  let failed = 0;

  for (const contract of contracts) {
    try {
      await upsertCommissionsForContract(contract.id, "Per-user recalculation");
      succeeded++;
    } catch {
      failed++;
    }
  }

  return NextResponse.json({
    processed: contracts.length,
    succeeded,
    failed,
  });
}
