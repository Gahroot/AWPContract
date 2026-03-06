import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createTerritorySchema } from "@/lib/validations";

// GET /api/territories - List territories
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const showAll = req.nextUrl.searchParams.get("all") === "true";

  const territories = await db.territory.findMany({
    where: showAll ? {} : { isActive: true },
    include: {
      _count: { select: { users: true } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(territories);
}

// POST /api/territories - Create territory (admin only)
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createTerritorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const existing = await db.territory.findUnique({
    where: { name: parsed.data.name },
  });
  if (existing) {
    return NextResponse.json(
      { error: "A territory with this name already exists" },
      { status: 409 }
    );
  }

  const territory = await db.territory.create({
    data: parsed.data,
    include: { _count: { select: { users: true } } },
  });

  return NextResponse.json(territory, { status: 201 });
}
