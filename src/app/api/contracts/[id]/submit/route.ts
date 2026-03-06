import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { calculateLineItem, calculateContractTotal, calculateBalanceDue, type LineItemInput } from "@/lib/pricing";
import { salesContractSubmitSchema } from "@/lib/validations";

// POST /api/contracts/[id]/submit - Finalize contract
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify ownership
  const existing = await db.contract.findUnique({ where: { id }, select: { userId: true } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (session.user.role !== "ADMIN" && existing.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // Validate with Zod schema
  const parsed = salesContractSubmitSchema.safeParse(body);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message || "Validation failed";
    return NextResponse.json({ error: firstError }, { status: 400 });
  }

  const { lineItems, ...contractData } = parsed.data;

  // Server-side price validation
  let serverTotal = 0;
  const processedItems = lineItems.map(
    (item: LineItemInput & { location?: string; sortOrder?: number; price?: number; type?: string; gridVerticalLines?: number; gridHorizontalLines?: number; gridPatternNotes?: string }, index: number) => {
      const serverPrice = calculateLineItem(item);
      serverTotal += serverPrice;

      // Check for price discrepancy > $0.01
      if (item.price && Math.abs(serverPrice - item.price) > 0.01) {
        console.warn(
          `Price discrepancy for item ${index}: client=${item.price}, server=${serverPrice}`
        );
      }

      return {
        location: item.location || "",
        type: item.type || "Window",
        qty: item.qty || 1,
        width: item.width || 0,
        height: item.height || 0,
        color: item.color || "White",
        series: item.series || "Patriot",
        frame: item.frame || "Nail Fin",
        function: item.function || "Slider",
        temperedGlass: item.temperedGlass || false,
        obscuredGlass: item.obscuredGlass || false,
        customShape: item.customShape || false,
        wrap: item.wrap || false,
        coated: item.coated || false,
        awpShutterRnr: item.awpShutterRnr || false,
        productCode: item.productCode || null,
        operation: item.operation || null,
        gridType: item.gridType || null,
        glassType: item.glassType || null,
        gridVerticalLines: item.gridVerticalLines ?? 0,
        gridHorizontalLines: item.gridHorizontalLines ?? 0,
        gridPatternNotes: item.gridPatternNotes || null,
        price: serverPrice,
        sortOrder: item.sortOrder ?? index,
      };
    }
  );

  const discount = contractData.discount;
  const downPayment = contractData.downPayment;
  const contractTotal = calculateContractTotal(serverTotal, discount);
  const balanceDue = calculateBalanceDue(contractTotal, downPayment);

  // Delete existing line items and recreate atomically
  let contract;
  try {
    contract = await db.$transaction(async (tx) => {
    await tx.lineItem.deleteMany({ where: { contractId: id } });

    return tx.contract.update({
      where: { id },
      data: {
        customerName: contractData.customerName,
        customerPhone: contractData.customerPhone || null,
        customerPhoneAlt: contractData.customerPhoneAlt || null,
        customerEmail: contractData.customerEmail || null,
        jobAddress: contractData.jobAddress || null,
        billingAddress: contractData.billingAddress || null,
        customerCity: contractData.customerCity || null,
        customerZip: contractData.customerZip || null,
        salesman: contractData.salesman || null,
        measuredBy: contractData.measuredBy || null,
        leadTest: contractData.leadTest || null,
        yearBuilt: contractData.yearBuilt || null,
        houseType: contractData.houseType || null,
        total: serverTotal,
        discount,
        contractTotal,
        downPayment,
        balanceDue,
        financeBalance: contractData.financeBalance,
        wfebAccount: contractData.wfebAccount || null,
        planNumber: contractData.planNumber || null,
        authNumber: contractData.authNumber || null,
        marketingSource: contractData.marketingSource ?? undefined,
        paymentMethod: contractData.paymentMethod || null,
        customerState: contractData.customerState || null,
        preferredCommunication: contractData.preferredCommunication || null,
        downPaymentMethod: contractData.downPaymentMethod || null,
        financingOption: contractData.financingOption || null,
        financingLoanId: contractData.financingLoanId || null,
        financingPlan: contractData.financingPlan || null,
        windowsBeingRemoved: contractData.windowsBeingRemoved || null,
        paymentNotes: contractData.paymentNotes || null,
        contractNotes: contractData.contractNotes || null,
        customerNotes: contractData.customerNotes || null,
        brickApplicationQty: contractData.brickApplicationQty,
        stuccoApplicationQty: contractData.stuccoApplicationQty,
        sidingApplicationQty: contractData.sidingApplicationQty,
        foundationApplicationQty: contractData.foundationApplicationQty,
        woodApplicationQty: contractData.woodApplicationQty,
        measurementNotes: contractData.measurementNotes || null,
        installByAWD: contractData.installByAWD ?? false,
        measurementsTakenBy: contractData.measurementsTakenBy || null,
        hasShutters: contractData.hasShutters ?? false,
        removalWindows: contractData.removalWindows ?? 0,
        removalDoors: contractData.removalDoors ?? 0,
        typeComingOut: contractData.typeComingOut || null,
        windowsComingOutOf: contractData.windowsComingOutOf ?? undefined,
        referredBy: contractData.referredBy || null,
        referralName: contractData.referralName || null,
        contractorSignature: contractData.contractorSignature,
        contractorSignatureDate: contractData.contractorSignatureDate
          ? new Date(contractData.contractorSignatureDate)
          : new Date(),
        customerSignature: contractData.customerSignature,
        customerSignatureDate: contractData.customerSignatureDate
          ? new Date(contractData.customerSignatureDate)
          : new Date(),
        authorizedSignature: contractData.authorizedSignature || null,
        authorizedSignatureDate: contractData.authorizedSignatureDate
          ? new Date(contractData.authorizedSignatureDate)
          : null,
        salesRepId: contractData.salesRepId || undefined,
        setterId: contractData.setterId !== undefined ? (contractData.setterId || null) : undefined,
        status: "COMPLETED",
        lineItems: {
          create: processedItems,
        },
      },
      include: { lineItems: true, addendums: { orderBy: { createdAt: "desc" }, take: 1 } },
    });
  });
  } catch (e) {
    console.error("Transaction failed:", e);
    return NextResponse.json({ error: "Failed to save contract" }, { status: 500 });
  }

  // Generate PDF
  try {
    const { generateAndSavePdf } = await import("@/lib/pdf");
    const url = await generateAndSavePdf(contract as Parameters<typeof generateAndSavePdf>[0]);
    await db.contract.update({ where: { id }, data: { pdfUrl: url } });
  } catch (e) {
    console.error("PDF generation failed:", e);
  }

  // HubSpot sync
  let hubspotSynced = false;
  try {
    const { syncContractToHubSpot } = await import("@/lib/hubspot");
    const result = await syncContractToHubSpot(contract as Parameters<typeof syncContractToHubSpot>[0]);
    hubspotSynced = result !== null;
  } catch (e) {
    console.error("HubSpot sync failed:", e);
  }

  // Commission calculation
  try {
    const { upsertCommissionsForContract } = await import("@/lib/commission");
    await upsertCommissionsForContract(id, "Initial calculation on contract completion");
  } catch (e) {
    console.error("Commission calculation failed:", e);
  }

  return NextResponse.json({
    contract,
    hubspot: hubspotSynced,
    shareUrl: `/contracts/view/${contract.accessToken}`,
  });
}
