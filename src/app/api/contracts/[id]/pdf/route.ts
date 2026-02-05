import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/contracts/[id]/pdf - Generate PDF
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const contract = await db.contract.findUnique({
    where: { id },
    include: {
      lineItems: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!contract) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Dynamic import to avoid SSR issues with react-pdf
  try {
    const { generateSalesContractPdf } = await import("@/lib/pdf");
    const pdfBuffer = await generateSalesContractPdf(contract);

    // Save to public/pdfs directory
    const fs = await import("fs/promises");
    const path = await import("path");
    const pdfDir = path.join(process.cwd(), "public", "pdfs");
    await fs.mkdir(pdfDir, { recursive: true });

    const filename = `contract-${contract.contractNumber}-${Date.now()}.pdf`;
    const filepath = path.join(pdfDir, filename);
    await fs.writeFile(filepath, Buffer.from(pdfBuffer));

    const url = `/pdfs/${filename}`;
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
