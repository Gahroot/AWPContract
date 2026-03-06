import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { validateRoleAssignments } from "@/lib/commission-validation";

// GET /api/commissions/validate - Validate commission role assignments
export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await validateRoleAssignments();
  return NextResponse.json(result);
}
