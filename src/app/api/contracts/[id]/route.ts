import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { calculateLineItem, calculateContractTotal, calculateBalanceDue, type LineItemInput } from "@/lib/pricing";

// GET /api/contracts/[id]
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
      addendums: { orderBy: { createdAt: "desc" } },
      changeOrders: { orderBy: { createdAt: "desc" } },
      salesRep: { select: { id: true, name: true, email: true } },
      setter: { select: { id: true, name: true, email: true } },
    },
  });

  if (!contract) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (session.user.role !== "ADMIN" && contract.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(contract);
}

// PATCH /api/contracts/[id] - Update (save draft)
export async function PATCH(
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

  try {
    const body = await req.json();
    const { lineItems, ...contractData } = body;

    // Recalculate pricing
    let total = 0;
    const processedItems = (lineItems || []).map(
      (item: LineItemInput & { location?: string; sortOrder?: number; type?: string }, index: number) => {
        const price = calculateLineItem(item);
        total += price;
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
          price,
          sortOrder: item.sortOrder ?? index,
        };
      }
    );

    const discount = parseFloat(contractData.discount) || 0;
    const downPayment = parseFloat(contractData.downPayment) || 0;
    const contractTotal = calculateContractTotal(total, discount);
    const balanceDue = calculateBalanceDue(contractTotal, downPayment);

    // Delete existing line items and recreate atomically
    const contract = await db.$transaction(async (tx) => {
      await tx.lineItem.deleteMany({ where: { contractId: id } });

      return tx.contract.update({
        where: { id },
        data: {
          customerName: contractData.customerName ?? undefined,
          customerPhone: contractData.customerPhone ?? undefined,
          customerPhoneAlt: contractData.customerPhoneAlt ?? undefined,
          customerEmail: contractData.customerEmail ?? undefined,
          jobAddress: contractData.jobAddress ?? undefined,
          billingAddress: contractData.billingAddress ?? undefined,
          customerCity: contractData.customerCity ?? undefined,
          customerZip: contractData.customerZip ?? undefined,
          salesman: contractData.salesman ?? undefined,
          measuredBy: contractData.measuredBy ?? undefined,
          leadTest: contractData.leadTest ?? undefined,
          yearBuilt: contractData.yearBuilt ?? undefined,
          houseType: contractData.houseType ?? undefined,
          total,
          discount,
          contractTotal,
          downPayment,
          balanceDue,
          financeBalance:
            contractData.financeBalance !== undefined
              ? parseFloat(contractData.financeBalance) || 0
              : undefined,
          wfebAccount: contractData.wfebAccount ?? undefined,
          planNumber: contractData.planNumber ?? undefined,
          authNumber: contractData.authNumber ?? undefined,
          marketingSource: contractData.marketingSource ?? undefined,
          paymentMethod: contractData.paymentMethod ?? undefined,
          customerState: contractData.customerState ?? undefined,
          preferredCommunication: contractData.preferredCommunication ?? undefined,
          downPaymentMethod: contractData.downPaymentMethod ?? undefined,
          financingOption: contractData.financingOption ?? undefined,
          financingLoanId: contractData.financingLoanId ?? undefined,
          financingPlan: contractData.financingPlan ?? undefined,
          windowsBeingRemoved: contractData.windowsBeingRemoved ?? undefined,
          paymentNotes: contractData.paymentNotes ?? undefined,
          contractNotes: contractData.contractNotes ?? undefined,
          customerNotes: contractData.customerNotes ?? undefined,
          brickApplicationQty: contractData.brickApplicationQty !== undefined
            ? parseInt(contractData.brickApplicationQty) || 0
            : undefined,
          stuccoApplicationQty: contractData.stuccoApplicationQty !== undefined
            ? parseInt(contractData.stuccoApplicationQty) || 0
            : undefined,
          sidingApplicationQty: contractData.sidingApplicationQty !== undefined
            ? parseInt(contractData.sidingApplicationQty) || 0
            : undefined,
          foundationApplicationQty: contractData.foundationApplicationQty !== undefined
            ? parseInt(contractData.foundationApplicationQty) || 0
            : undefined,
          woodApplicationQty: contractData.woodApplicationQty !== undefined
            ? parseInt(contractData.woodApplicationQty) || 0
            : undefined,
          salesRepId: contractData.salesRepId ?? undefined,
          setterId: contractData.setterId !== undefined ? (contractData.setterId || null) : undefined,
          measurementNotes: contractData.measurementNotes ?? undefined,
          contractorSignature: contractData.contractorSignature ?? undefined,
          contractorSignatureDate: contractData.contractorSignatureDate
            ? new Date(contractData.contractorSignatureDate)
            : undefined,
          customerSignature: contractData.customerSignature ?? undefined,
          customerSignatureDate: contractData.customerSignatureDate
            ? new Date(contractData.customerSignatureDate)
            : undefined,
          status: contractData.status ?? undefined,
          lineItems: {
            create: processedItems,
          },
        },
        include: { lineItems: true },
      });
    });

    return NextResponse.json(contract);
  } catch (error) {
    console.error("Failed to update contract:", error);
    const message = error instanceof Error ? error.message : "Failed to update contract";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
