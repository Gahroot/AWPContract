import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { updateTerritorySchema } from "@/lib/validations";

// GET /api/territories/[id] - Get territory with users
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const territory = await db.territory.findUnique({
    where: { id },
    include: {
      users: {
        select: { id: true, name: true, email: true, isTerritoryOwner: true },
        orderBy: { name: "asc" },
      },
    },
  });

  if (!territory) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(territory);
}

// PATCH /api/territories/[id] - Update territory (admin only)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = updateTerritorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // Check name uniqueness if changing name
  if (parsed.data.name) {
    const existing = await db.territory.findFirst({
      where: { name: parsed.data.name, id: { not: id } },
    });
    if (existing) {
      return NextResponse.json(
        { error: "A territory with this name already exists" },
        { status: 409 }
      );
    }
  }

  const territory = await db.territory.update({
    where: { id },
    data: parsed.data,
    include: { _count: { select: { users: true } } },
  });

  return NextResponse.json(territory);
}

// DELETE /api/territories/[id] - Delete territory (admin only)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const territory = await db.territory.findUnique({
    where: { id },
    include: { _count: { select: { users: true } } },
  });

  if (!territory) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (territory._count.users > 0) {
    // Soft delete - just mark inactive
    await db.territory.update({
      where: { id },
      data: { isActive: false },
    });
    return NextResponse.json({ message: "Territory deactivated" });
  }

  await db.territory.delete({ where: { id } });
  return NextResponse.json({ message: "Territory deleted" });
}
