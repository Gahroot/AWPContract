import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { calculateLineItem, calculateContractTotal, calculateBalanceDue, type LineItemInput } from "@/lib/pricing";

// POST /api/pricing/calculate - Server-side price validation
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { lineItems, discount, downPayment } = body;

  const itemPrices = (lineItems || []).map((item: LineItemInput) =>
    calculateLineItem(item)
  );

  const total = itemPrices.reduce((sum: number, p: number) => sum + p, 0);
  const contractTotal = calculateContractTotal(total, discount || 0);
  const balanceDue = calculateBalanceDue(contractTotal, downPayment || 0);

  return NextResponse.json({
    itemPrices,
    total,
    contractTotal,
    balanceDue,
  });
}
