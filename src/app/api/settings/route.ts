import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const SETTING_KEYS = [
  "company_name",
  "company_phone",
  "company_address",
  "hubspot_api_key",
];

// GET /api/settings
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await db.setting.findMany({
    where: { key: { in: SETTING_KEYS } },
  });

  const result: Record<string, string> = {};
  for (const key of SETTING_KEYS) {
    result[key] = settings.find((s) => s.key === key)?.value ?? "";
  }

  return NextResponse.json(result);
}

// PUT /api/settings
export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  for (const key of SETTING_KEYS) {
    if (body[key] !== undefined) {
      await db.setting.upsert({
        where: { key },
        update: { value: body[key] },
        create: { key, value: body[key] },
      });
    }
  }

  return NextResponse.json({ success: true });
}
