import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// DELETE /api/invites/[id] - Revoke a pending invite (admin only)
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const invite = await db.invite.findUnique({ where: { id } });
  if (!invite) {
    return NextResponse.json({ error: "Invite not found" }, { status: 404 });
  }

  if (invite.status !== "PENDING") {
    return NextResponse.json(
      { error: "Only pending invites can be revoked" },
      { status: 400 }
    );
  }

  const updated = await db.invite.update({
    where: { id },
    data: { status: "REVOKED" },
  });

  return NextResponse.json(updated);
}
