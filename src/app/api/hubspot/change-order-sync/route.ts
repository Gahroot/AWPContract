import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// POST /api/hubspot/change-order-sync - Manually sync change order to HubSpot
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const { changeOrderId } = body;

  if (!changeOrderId) {
    return NextResponse.json(
      { error: "changeOrderId is required" },
      { status: 400 }
    );
  }

  // Get change order with contract
  const changeOrder = await db.changeOrder.findUnique({
    where: { id: changeOrderId },
    include: {
      contract: {
        select: {
          id: true,
          hubspotDealId: true,
          contractTotal: true,
          userId: true,
        },
      },
    },
  });

  if (!changeOrder) {
    return NextResponse.json({ error: "Change order not found" }, { status: 404 });
  }

  if (
    session.user.role !== "ADMIN" &&
    changeOrder.contract.userId !== session.user.id
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

  if (!changeOrder.contract.hubspotDealId) {
    return NextResponse.json(
      { error: "Contract has not been synced to HubSpot yet" },
      { status: 400 }
    );
  }

  try {
    const { syncChangeOrder, toChangeOrderData } = await import("@/lib/hubspot");
    const result = await syncChangeOrder(
      toChangeOrderData(changeOrder),
      {
        hubspotDealId: changeOrder.contract.hubspotDealId,
        contractTotal: changeOrder.contract.contractTotal,
      },
      setting.value
    );

    if (!result) {
      return NextResponse.json(
        { error: "Failed to sync change order to HubSpot" },
        { status: 500 }
      );
    }

    // Save HubSpot note ID
    await db.changeOrder.update({
      where: { id: changeOrderId },
      data: {
        hubspotNoteId: result.noteId,
        syncedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      noteId: result.noteId,
      dealUpdated: result.dealUpdated,
    });
  } catch (e: unknown) {
    console.error("HubSpot change order sync error:", e);
    return NextResponse.json({ error: "HubSpot sync failed" }, { status: 500 });
  }
}
