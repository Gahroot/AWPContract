import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { calculateLineItem, calculateContractTotal, calculateBalanceDue, type LineItemInput } from "@/lib/pricing";

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

  const body = await req.json();
  const { lineItems, ...contractData } = body;

  // Validate required fields
  if (!contractData.customerName) {
    return NextResponse.json(
      { error: "Customer name is required" },
      { status: 400 }
    );
  }
  if (!contractData.customerSignature) {
    return NextResponse.json(
      { error: "Customer signature is required" },
      { status: 400 }
    );
  }
  if (!contractData.contractorSignature) {
    return NextResponse.json(
      { error: "Contractor signature is required" },
      { status: 400 }
    );
  }
  if (!lineItems || lineItems.length === 0) {
    return NextResponse.json(
      { error: "At least one line item is required" },
      { status: 400 }
    );
  }

  // Server-side price validation
  let serverTotal = 0;
  const processedItems = lineItems.map(
    (item: LineItemInput & { location?: string; sortOrder?: number; price?: number; type?: string }, index: number) => {
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
        price: serverPrice,
        sortOrder: item.sortOrder ?? index,
      };
    }
  );

  const discount = parseFloat(contractData.discount) || 0;
  const downPayment = parseFloat(contractData.downPayment) || 0;
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
        financeBalance: parseFloat(contractData.financeBalance) || 0,
        wfebAccount: contractData.wfebAccount || null,
        planNumber: contractData.planNumber || null,
        authNumber: contractData.authNumber || null,
        marketingSource: contractData.marketingSource || null,
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
        brickApplicationQty: parseInt(contractData.brickApplicationQty) || 0,
        stuccoApplicationQty: parseInt(contractData.stuccoApplicationQty) || 0,
        sidingApplicationQty: parseInt(contractData.sidingApplicationQty) || 0,
        foundationApplicationQty: parseInt(contractData.foundationApplicationQty) || 0,
        woodApplicationQty: parseInt(contractData.woodApplicationQty) || 0,
        measurementNotes: contractData.measurementNotes || null,
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
        status: "COMPLETED",
        lineItems: {
          create: processedItems,
        },
      },
      include: { lineItems: true },
    });
  });
  } catch (e) {
    console.error("Transaction failed:", e);
    return NextResponse.json({ error: "Failed to save contract" }, { status: 500 });
  }

  // Generate PDF
  try {
    const { generateAndSavePdf } = await import("@/lib/pdf");
    const url = await generateAndSavePdf(contract);
    await db.contract.update({ where: { id }, data: { pdfUrl: url } });
  } catch (e) {
    console.error("PDF generation failed:", e);
  }

  // HubSpot sync
  let hubspotSynced = false;
  try {
    const { syncContractToHubSpot } = await import("@/lib/hubspot");
    const result = await syncContractToHubSpot(contract);
    hubspotSynced = result !== null;
  } catch (e) {
    console.error("HubSpot sync failed:", e);
  }

  // Commission calculation
  try {
    const { upsertCommissionForContract } = await import("@/lib/commission");
    await upsertCommissionForContract(id, "Initial calculation on contract completion");
  } catch (e) {
    console.error("Commission calculation failed:", e);
  }

  return NextResponse.json({
    contract,
    hubspot: hubspotSynced,
    shareUrl: `/contracts/view/${contract.accessToken}`,
  });
}
