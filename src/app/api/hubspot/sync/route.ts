import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// POST /api/hubspot/sync - Sync contract to HubSpot
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { contractId } = await req.json();

  const contract = await db.contract.findUnique({
    where: { id: contractId },
    include: { lineItems: true },
  });

  if (!contract) {
    return NextResponse.json({ error: "Contract not found" }, { status: 404 });
  }

  // Get HubSpot API key from settings
  const setting = await db.setting.findUnique({
    where: { key: "hubspot_api_key" },
  });

  if (!setting?.value) {
    return NextResponse.json(
      { error: "HubSpot API key not configured" },
      { status: 400 }
    );
  }

  try {
    const { syncContract } = await import("@/lib/hubspot");
    const result = await syncContract(contract, setting.value);

    // Save HubSpot IDs
    await db.contract.update({
      where: { id: contractId },
      data: {
        hubspotContactId: result.contactId,
        hubspotDealId: result.dealId,
      },
    });

    return NextResponse.json({ success: true, ...result });
  } catch (e: unknown) {
    console.error("HubSpot sync error:", e);
    const message = e instanceof Error ? e.message : "HubSpot sync failed";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
