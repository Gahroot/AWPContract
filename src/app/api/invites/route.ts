import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createInviteSchema } from "@/lib/validations";

// POST /api/invites - Create a new invite (admin only)
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createInviteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { email, role, isSetterManager, isTerritoryOwner, isVP, isNSM, territoryId } = parsed.data;

  // Check if user with this email already exists
  const existingUser = await db.user.findUnique({ where: { email } });
  if (existingUser) {
    return NextResponse.json(
      { error: "A user with this email already exists" },
      { status: 409 }
    );
  }

  // Check for an existing pending invite for this email
  const existingInvite = await db.invite.findFirst({
    where: { email, status: "PENDING" },
  });
  if (existingInvite) {
    return NextResponse.json(
      { error: "A pending invite already exists for this email" },
      { status: 409 }
    );
  }

  // Get inviter's market
  const inviter = await db.user.findUnique({
    where: { id: session.user.id },
    select: { market: true },
  });

  const invite = await db.invite.create({
    data: {
      email,
      role,
      market: inviter?.market ?? "SLC",
      invitedById: session.user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      isSetterManager: isSetterManager ?? false,
      isTerritoryOwner: isTerritoryOwner ?? false,
      isVP: isVP ?? false,
      isNSM: isNSM ?? false,
      territoryId: territoryId ?? null,
    },
  });

  const url = `${req.nextUrl.origin}/invite/${invite.token}`;

  return NextResponse.json({ invite, url }, { status: 201 });
}

// GET /api/invites - List all invites (admin only)
export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const invites = await db.invite.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      invitedBy: { select: { name: true, email: true } },
      acceptedBy: { select: { name: true, email: true } },
    },
  });

  return NextResponse.json(invites);
}
