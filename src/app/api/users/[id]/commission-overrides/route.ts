import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { upsertOverridesSchema } from "@/lib/validations";

// GET /api/users/[id]/commission-overrides - List overrides for a user
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const overrides = await db.userCommissionOverride.findMany({
    where: { userId: id },
    orderBy: { commissionType: "asc" },
  });

  return NextResponse.json(overrides);
}

// PUT /api/users/[id]/commission-overrides - Upsert overrides
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = upsertOverridesSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // Verify user exists
  const user = await db.user.findUnique({ where: { id } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const results = await db.$transaction(
    parsed.data.overrides.map((override) =>
      db.userCommissionOverride.upsert({
        where: {
          userId_commissionType: {
            userId: id,
            commissionType: override.commissionType,
          },
        },
        create: {
          userId: id,
          commissionType: override.commissionType,
          rateOverride: override.rateOverride,
        },
        update: {
          rateOverride: override.rateOverride,
          isActive: true,
        },
      })
    )
  );

  return NextResponse.json(results);
}

// DELETE /api/users/[id]/commission-overrides - Remove override by type
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const type = req.nextUrl.searchParams.get("type");
  if (!type) {
    return NextResponse.json({ error: "type query parameter required" }, { status: 400 });
  }

  await db.userCommissionOverride.deleteMany({
    where: { userId: id, commissionType: type as never },
  });

  return NextResponse.json({ message: "Override removed" });
}
