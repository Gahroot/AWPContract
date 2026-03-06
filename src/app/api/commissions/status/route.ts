import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const bulkStatusSchema = z.object({
  ids: z.array(z.string()).min(1, "At least one ID required"),
  status: z.enum(["APPROVED", "PAID"]),
});

// POST /api/commissions/status - Bulk approve/pay commission records
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = bulkStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { ids, status } = parsed.data;
  const requiredCurrentStatus = status === "APPROVED" ? "PENDING" : "APPROVED";

  const result = await db.$transaction(async (tx) => {
    // Fetch records to validate
    const records = await tx.commissionRecord.findMany({
      where: { id: { in: ids } },
      select: { id: true, status: true },
    });

    const validIds: string[] = [];
    const skipped: string[] = [];
    const notFound: string[] = [];

    const foundIds = new Set(records.map((r) => r.id));
    for (const id of ids) {
      if (!foundIds.has(id)) {
        notFound.push(id);
      }
    }

    for (const record of records) {
      if (record.status === requiredCurrentStatus) {
        validIds.push(record.id);
      } else {
        skipped.push(record.id);
      }
    }

    if (validIds.length > 0) {
      const now = new Date();
      await tx.commissionRecord.updateMany({
        where: { id: { in: validIds } },
        data: {
          status,
          ...(status === "APPROVED"
            ? { approvedAt: now, approvedBy: session.user!.id }
            : { paidAt: now }),
        },
      });
    }

    return {
      updated: validIds.length,
      skipped: skipped.length,
      notFound: notFound.length,
    };
  });

  return NextResponse.json(result);
}
