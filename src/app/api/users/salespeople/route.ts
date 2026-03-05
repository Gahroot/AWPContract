import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/users/salespeople - List all salespeople for dropdowns
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const users = await db.user.findMany({
    where: { role: "SALESMAN" },
    select: {
      id: true,
      name: true,
      email: true,
      market: true,
      isSetterManager: true,
      isTerritoryOwner: true,
      isVP: true,
      isNSM: true,
      territory: true,
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(users);
}
