import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/users/territories - Get all territories
export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const territories = await db.territory.findMany({
    where: { isActive: true },
    select: { id: true, name: true, market: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(territories);
}

// POST /api/users/territories - Create a new territory
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const { name, market } = body;
  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const existing = await db.territory.findUnique({ where: { name } });
  if (existing) {
    return NextResponse.json(existing);
  }

  const territory = await db.territory.create({
    data: { name, market: market || "SLC" },
    select: { id: true, name: true, market: true },
  });

  return NextResponse.json(territory, { status: 201 });
}
