import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/contracts/[id]/pdf - Generate PDF
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contract = await db.contract.findUnique({
    where: { id },
    include: {
      lineItems: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!contract) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (session.user.role !== "ADMIN" && contract.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Dynamic import to avoid SSR issues with react-pdf
  try {
    const { generateAndSavePdf } = await import("@/lib/pdf");
    const url = await generateAndSavePdf(contract);
    await db.contract.update({
      where: { id },
      data: { pdfUrl: url },
    });

    return NextResponse.json({ url });
  } catch (e) {
    console.error("PDF generation error:", e);
    return NextResponse.json(
      { error: "PDF generation failed" },
      { status: 500 }
    );
  }
}
