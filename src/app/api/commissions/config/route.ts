import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { commissionSettingsSchema } from "@/lib/validations";

// GET /api/commissions/config - Get commission settings + management users
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await db.commissionSettings.findFirst();

  const managementUsers = await db.user.findMany({
    where: {
      OR: [
        { isSetterManager: true },
        { isTerritoryOwner: true },
        { isVP: true },
        { isNSM: true },
      ],
    },
    select: {
      id: true,
      name: true,
      email: true,
      isSetterManager: true,
      isTerritoryOwner: true,
      isVP: true,
      isNSM: true,
      territory: true,
    },
  });

  return NextResponse.json({
    settings: settings ?? null,
    managementUsers,
  });
}

// PUT /api/commissions/config - Update commission settings
export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = commissionSettingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid data", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const existing = await db.commissionSettings.findFirst();
  if (existing) {
    await db.commissionSettings.update({
      where: { id: existing.id },
      data: parsed.data,
    });
  } else {
    await db.commissionSettings.create({
      data: parsed.data,
    });
  }

  return NextResponse.json({ success: true });
}
