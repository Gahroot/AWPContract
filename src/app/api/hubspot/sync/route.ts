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

  if (session.user.role !== "ADMIN" && contract.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
    const { syncContractToHubSpot } = await import("@/lib/hubspot");
    const result = await syncContractToHubSpot(contract);

    if (!result) {
      return NextResponse.json(
        { error: "HubSpot sync returned no result" },
        { status: 500 }
      );
    }

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
