import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// POST /api/hubspot/sync - Sync contract to HubSpot
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const { contractId } = body;

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

  // Set syncing status
  await db.contract.update({
    where: { id: contractId },
    data: { hubspotSyncStatus: "syncing" }
  });

  try {
    const { syncContractToHubSpot } = await import("@/lib/hubspot");
    const result = await syncContractToHubSpot(contract);

    if (!result) {
      await db.contract.update({
        where: { id: contractId },
        data: {
          hubspotSyncStatus: "failed",
          hubspotSyncError: "HubSpot sync returned no result"
        }
      });
      return NextResponse.json(
        { error: "HubSpot sync returned no result" },
        { status: 500 }
      );
    }

    // On success: set status, timestamp, clear error
    await db.contract.update({
      where: { id: contractId },
      data: {
        hubspotSyncStatus: "synced",
        hubspotLastSynced: new Date(),
        hubspotSyncError: null
      }
    });

    return NextResponse.json({ success: true, ...result });
  } catch (e: unknown) {
    console.error("HubSpot sync error:", e);
    const message = e instanceof Error ? e.message : "HubSpot sync failed";

    // On failure: set failed status, save error
    await db.contract.update({
      where: { id: contractId },
      data: {
        hubspotSyncStatus: "failed",
        hubspotSyncError: message
      }
    });

    return NextResponse.json(
      { error: "HubSpot sync failed" },
      { status: 500 }
    );
  }
}
