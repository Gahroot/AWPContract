import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { acceptInviteSchema } from "@/lib/validations";
import bcrypt from "bcryptjs";

// GET /api/invites/accept/[token] - Get invite details (public)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const invite = await db.invite.findUnique({
    where: { token },
    include: {
      invitedBy: { select: { name: true } },
    },
  });

  if (!invite) {
    return NextResponse.json({ error: "Invite not found" }, { status: 404 });
  }

  if (invite.status !== "PENDING") {
    return NextResponse.json(
      { error: "This invite is no longer valid" },
      { status: 410 }
    );
  }

  if (new Date() > invite.expiresAt) {
    return NextResponse.json(
      { error: "This invite has expired" },
      { status: 410 }
    );
  }

  return NextResponse.json({
    email: invite.email,
    role: invite.role,
    market: invite.market,
    inviterName: invite.invitedBy.name ?? invite.invitedBy.name,
  });
}

// POST /api/invites/accept/[token] - Accept invite and create account (public)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const invite = await db.invite.findUnique({ where: { token } });

  if (!invite) {
    return NextResponse.json({ error: "Invite not found" }, { status: 404 });
  }

  if (invite.status !== "PENDING") {
    return NextResponse.json(
      { error: "This invite is no longer valid" },
      { status: 410 }
    );
  }

  if (new Date() > invite.expiresAt) {
    return NextResponse.json(
      { error: "This invite has expired" },
      { status: 410 }
    );
  }

  const body = await req.json();
  const parsed = acceptInviteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { name, password } = parsed.data;

  // Check if user already exists
  const existingUser = await db.user.findUnique({
    where: { email: invite.email },
  });
  if (existingUser) {
    return NextResponse.json(
      { error: "A user with this email already exists" },
      { status: 409 }
    );
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  await db.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name,
        email: invite.email,
        password: hashedPassword,
        role: invite.role,
        market: invite.market,
        isSetterManager: invite.isSetterManager,
        isTerritoryOwner: invite.isTerritoryOwner,
        isVP: invite.isVP,
        isNSM: invite.isNSM,
        territoryId: invite.territoryId,
      },
    });

    await tx.invite.update({
      where: { id: invite.id },
      data: {
        status: "ACCEPTED",
        acceptedById: user.id,
      },
    });
  });

  return NextResponse.json(
    { message: "Account created successfully" },
    { status: 201 }
  );
}
