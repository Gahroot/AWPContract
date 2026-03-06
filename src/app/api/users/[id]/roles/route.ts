import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// PATCH /api/users/[id]/roles - Toggle management flags
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  const data: Record<string, unknown> = {};
  if (typeof body.isSetterManager === "boolean") data.isSetterManager = body.isSetterManager;
  if (typeof body.isTerritoryOwner === "boolean") data.isTerritoryOwner = body.isTerritoryOwner;
  if (typeof body.isVP === "boolean") data.isVP = body.isVP;
  if (typeof body.isNSM === "boolean") data.isNSM = body.isNSM;
  if (body.territoryId !== undefined) data.territoryId = body.territoryId || null;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No valid fields provided" }, { status: 400 });
  }

  const user = await db.user.update({
    where: { id },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      isSetterManager: true,
      isTerritoryOwner: true,
      isVP: true,
      isNSM: true,
      territoryId: true,
    },
  });

  return NextResponse.json(user);
}
