import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST /api/contracts/public/[token]/sign - Customer signing (no auth)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const contract = await db.contract.findUnique({
    where: { accessToken: token },
  });

  if (!contract) {
    return NextResponse.json({ error: "Contract not found" }, { status: 404 });
  }

  if (contract.status !== "PENDING_SIGNATURE") {
    return NextResponse.json(
      { error: "Contract is not pending signature" },
      { status: 400 }
    );
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // Validate signature - whitelist MIME types and enforce size limit
  const dataUriRegex = /^data:image\/(png|jpeg);base64,/;
  if (!body.customerSignature || !dataUriRegex.test(body.customerSignature)) {
    return NextResponse.json(
      { error: "Valid customer signature is required (PNG or JPEG)" },
      { status: 400 }
    );
  }
  const base64Data = body.customerSignature.split(",")[1];
  if (Buffer.from(base64Data, "base64").length > 500_000) {
    return NextResponse.json(
      { error: "Signature image too large (max 500KB)" },
      { status: 400 }
    );
  }

  const updated = await db.contract.update({
    where: { id: contract.id },
    data: {
      customerSignature: body.customerSignature,
      customerSignatureDate: new Date(),
      customerAcceptedTerms: true,
      paymentMethod: body.paymentMethod || null,
      status: "SIGNED",
    },
    include: {
      lineItems: { orderBy: { sortOrder: "asc" } },
      addendums: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  let pdfUrl = updated.pdfUrl;

  // Generate PDF
  try {
    const { generateAndSavePdf } = await import("@/lib/pdf");
    const url = await generateAndSavePdf(updated);
    await db.contract.update({ where: { id: contract.id }, data: { pdfUrl: url } });
    pdfUrl = url;
  } catch (e) {
    console.error("PDF generation failed:", e);
  }

  // HubSpot sync
  try {
    const { syncContractToHubSpot } = await import("@/lib/hubspot");
    await syncContractToHubSpot(updated);
  } catch (e) {
    console.error("HubSpot sync failed:", e);
  }

  return NextResponse.json({
    success: true,
    contractId: updated.id,
    pdfUrl,
  });
}
