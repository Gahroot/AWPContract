import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/contracts/public/[token] - Public contract view (no auth)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const contract = await db.contract.findUnique({
    where: { accessToken: token },
    include: {
      lineItems: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!contract) {
    return NextResponse.json({ error: "Contract not found" }, { status: 404 });
  }

  // Strip sensitive fields
  const {
    userId: _userId,
    accessToken: _token,
    hubspotDealId: _hd,
    hubspotContactId: _hc,
    hubspotSyncStatus: _hs,
    hubspotLastSynced: _hls,
    hubspotSyncError: _hse,
    ...publicData
  } = contract;

  return NextResponse.json(publicData);
}
