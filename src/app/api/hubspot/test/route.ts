import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// POST /api/hubspot/test - Test HubSpot connection
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const setting = await db.setting.findUnique({
    where: { key: "hubspot_api_key" },
  });

  if (!setting?.value) {
    return NextResponse.json(
      { success: false, error: "HubSpot API key not configured" },
      { status: 400 }
    );
  }

  try {
    const { testConnection } = await import("@/lib/hubspot");
    const success = await testConnection(setting.value);
    return NextResponse.json({ success });
  } catch (e: any) {
    return NextResponse.json({
      success: false,
      error: e.message || "Connection failed",
    });
  }
}
