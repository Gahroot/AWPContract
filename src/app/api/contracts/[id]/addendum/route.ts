import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/contracts/[id]/addendum - List addendums
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify ownership
  const contract = await db.contract.findUnique({ where: { id }, select: { userId: true } });
  if (!contract) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (session.user.role !== "ADMIN" && contract.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const addendums = await db.addendum.findMany({
    where: { contractId: id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(addendums);
}

// POST /api/contracts/[id]/addendum - Create addendum
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify parent contract exists
  const contract = await db.contract.findUnique({ where: { id } });
  if (!contract) {
    return NextResponse.json({ error: "Contract not found" }, { status: 404 });
  }
  if (session.user.role !== "ADMIN" && contract.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();

  const addendum = await db.addendum.create({
    data: {
      contractId: id,
      products: body.products || null,
      interiorColor: body.interiorColor || null,
      exteriorColor: body.exteriorColor || null,
      colorDescription: body.colorDescription || null,
      installRemoveOld: body.installRemoveOld || false,
      installHaulAway: body.installHaulAway || false,
      installInteriorTrim: body.installInteriorTrim || false,
      installExteriorTrim: body.installExteriorTrim || false,
      installCaulkSeal: body.installCaulkSeal || false,
      installScreens: body.installScreens || false,
      installHardware: body.installHardware || false,
      installWeatherstrip: body.installWeatherstrip || false,
      installCleanup: body.installCleanup || false,
      installOther: body.installOther || false,
      installNotes: body.installNotes || null,
      ackMeasurements: body.ackMeasurements || false,
      ackSpecifications: body.ackSpecifications || false,
      ackPricing: body.ackPricing || false,
      ackTerms: body.ackTerms || false,
      ackInitials: body.ackInitials || null,
      referralName: body.referralName || null,
      referralPhone: body.referralPhone || null,
      notes: body.notes || null,
      customerSignature: body.customerSignature || null,
      customerSignatureDate: body.customerSignatureDate
        ? new Date(body.customerSignatureDate)
        : null,
      contractorSignature: body.contractorSignature || null,
      contractorSignatureDate: body.contractorSignatureDate
        ? new Date(body.contractorSignatureDate)
        : null,
    },
  });

  // Non-blocking HubSpot sync if addendum is signed and contract has HubSpot deal
  if (
    contract.hubspotDealId &&
    addendum.customerSignature &&
    addendum.contractorSignature
  ) {
    // Fire and forget sync
    (async () => {
      try {
        const setting = await db.setting.findUnique({ where: { key: "hubspot_api_key" } });
        if (setting?.value) {
          const { syncAddendum, toAddendumData } = await import("@/lib/hubspot");
          await syncAddendum(toAddendumData(addendum), contract, setting.value);
        }
      } catch (err) {
        console.error("HubSpot addendum sync error:", err);
      }
    })();
  }

  return NextResponse.json(addendum, { status: 201 });
}
