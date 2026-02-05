import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/contracts/[id]/change-order - List change orders
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const changeOrders = await db.changeOrder.findMany({
    where: { contractId: id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(changeOrders);
}

// POST /api/contracts/[id]/change-order - Create change order
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contract = await db.contract.findUnique({ where: { id } });
  if (!contract) {
    return NextResponse.json({ error: "Contract not found" }, { status: 404 });
  }

  const body = await req.json();

  // Calculate new price based on change type
  const originalPrice = contract.contractTotal;
  let newPrice = originalPrice;
  const amount = parseFloat(body.priceChangeAmount) || 0;

  if (body.priceChangeType === "increase") {
    newPrice = originalPrice + amount;
  } else if (body.priceChangeType === "decrease") {
    newPrice = originalPrice - amount;
  }

  const newBalanceDue = newPrice - contract.downPayment;

  // Count existing change orders for sequential numbering
  const count = await db.changeOrder.count({ where: { contractId: id } });
  const changeOrderNumber = `CO-${contract.contractNumber.slice(0, 8)}-${count + 1}`;

  const changeOrder = await db.changeOrder.create({
    data: {
      contractId: id,
      changeOrderNumber,
      changesDescription: body.changesDescription || null,
      priceChangeType: body.priceChangeType || "no_change",
      priceChangeAmount: amount,
      originalPrice,
      newPrice,
      newBalanceDue: Math.max(0, newBalanceDue),
      customerSignature: body.customerSignature || null,
      customerSignatureDate: body.customerSignatureDate
        ? new Date(body.customerSignatureDate)
        : null,
      awpSignature: body.awpSignature || null,
      awpSignatureDate: body.awpSignatureDate
        ? new Date(body.awpSignatureDate)
        : null,
    },
  });

  // Update parent contract pricing if price changed
  if (body.priceChangeType !== "no_change") {
    await db.contract.update({
      where: { id },
      data: {
        contractTotal: newPrice,
        balanceDue: Math.max(0, newBalanceDue),
      },
    });
  }

  return NextResponse.json(changeOrder, { status: 201 });
}
