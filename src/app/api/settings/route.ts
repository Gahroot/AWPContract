import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const PUBLIC_SETTING_KEYS = [
  "company_name",
  "company_phone",
  "company_address",
];

const ADMIN_SETTING_KEYS = [...PUBLIC_SETTING_KEYS, "hubspot_api_key", "hubspot_sync_enabled"];

// GET /api/settings
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isAdmin = session.user.role === "ADMIN";
  const keys = isAdmin ? ADMIN_SETTING_KEYS : PUBLIC_SETTING_KEYS;

  const settings = await db.setting.findMany({
    where: { key: { in: keys } },
  });

  const result: Record<string, string> = {};
  for (const key of keys) {
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

  for (const key of ADMIN_SETTING_KEYS) {
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
