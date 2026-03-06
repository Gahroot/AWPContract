import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// POST /api/hubspot/addendum-sync - Manually sync addendum to HubSpot
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const { addendumId } = body;

  if (!addendumId) {
    return NextResponse.json(
      { error: "addendumId is required" },
      { status: 400 }
    );
  }

  // Get addendum with contract
  const addendum = await db.addendum.findUnique({
    where: { id: addendumId },
    include: {
      contract: {
        select: {
          id: true,
          hubspotDealId: true,
          customerName: true,
          userId: true,
        },
      },
    },
  });

  if (!addendum) {
    return NextResponse.json({ error: "Addendum not found" }, { status: 404 });
  }

  if (
    session.user.role !== "ADMIN" &&
    addendum.contract.userId !== session.user.id
  ) {
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

  if (!addendum.contract.hubspotDealId) {
    return NextResponse.json(
      { error: "Contract has not been synced to HubSpot yet" },
      { status: 400 }
    );
  }

  try {
    const { syncAddendum, toAddendumData } = await import("@/lib/hubspot");
    const result = await syncAddendum(
      toAddendumData(addendum),
      {
        hubspotDealId: addendum.contract.hubspotDealId,
        customerName: addendum.contract.customerName,
      },
      setting.value
    );

    if (!result) {
      return NextResponse.json(
        { error: "Failed to sync addendum to HubSpot" },
        { status: 500 }
      );
    }

    // Save HubSpot note ID
    await db.addendum.update({
      where: { id: addendumId },
      data: {
        hubspotNoteId: result.noteId,
        syncedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, noteId: result.noteId });
  } catch (e: unknown) {
    console.error("HubSpot addendum sync error:", e);
    return NextResponse.json({ error: "HubSpot sync failed" }, { status: 500 });
  }
}
