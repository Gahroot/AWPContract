import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Prisma, ContractStatus } from "@/generated/prisma/client";
import { calculateLineItem, calculateContractTotal, calculateBalanceDue, type LineItemInput } from "@/lib/pricing";

// GET /api/contracts - List contracts with pagination & filters
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const status = searchParams.get("status");
  const search = searchParams.get("search");
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1") || 1);
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "10") || 10));
  const skip = (page - 1) * limit;

  const where: Prisma.ContractWhereInput = {};

  if (status) {
    where.status = status as ContractStatus;
  }

  if (search) {
    where.OR = [
      { customerName: { contains: search, mode: "insensitive" } },
      { jobAddress: { contains: search, mode: "insensitive" } },
      { contractNumber: { contains: search, mode: "insensitive" } },
    ];
  }

  // Non-admin users only see their own contracts
  if (session.user.role !== "ADMIN") {
    where.userId = session.user.id;
  }

  const [contracts, total, draft, pendingSignature, completed] =
    await Promise.all([
      db.contract.findMany({
        where,
        select: {
          id: true,
          contractNumber: true,
          customerName: true,
          jobAddress: true,
          contractTotal: true,
          status: true,
          createdAt: true,
          hubspotSyncStatus: true,
          hubspotLastSynced: true,
          hubspotSyncError: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.contract.count({ where }),
      db.contract.count({
        where: { ...where, status: "DRAFT" },
      }),
      db.contract.count({
        where: { ...where, status: "PENDING_SIGNATURE" },
      }),
      db.contract.count({
        where: { ...where, status: "COMPLETED" },
      }),
    ]);

  return NextResponse.json({
    contracts,
    total,
    stats: {
      total,
      draft,
      pendingSignature,
      completed,
    },
  });
}

// POST /api/contracts - Create new contract
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Verify user exists (prevents FK violation after DB reset with stale JWT)
    const userExists = await db.user.findUnique({
      where: { id: session.user.id },
      select: { id: true },
    });
    if (!userExists) {
      return NextResponse.json(
        { error: "Session expired. Please log out and log back in." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { lineItems, ...contractData } = body;

    // Calculate pricing server-side
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

    const contract = await db.contract.create({
      data: {
        customerName: contractData.customerName || null,
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
        total,
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
        contractorSignature: contractData.contractorSignature || null,
        contractorSignatureDate: contractData.contractorSignatureDate
          ? new Date(contractData.contractorSignatureDate)
          : null,
        status: "DRAFT",
        userId: session.user.id,
        lineItems: {
          create: processedItems,
        },
      },
      include: { lineItems: true },
    });

    return NextResponse.json(contract, { status: 201 });
  } catch (error) {
    console.error("Failed to create contract:", error);
    const message = error instanceof Error ? error.message : "Failed to create contract";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
