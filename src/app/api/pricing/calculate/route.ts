import { NextRequest, NextResponse } from "next/server";
import { calculateLineItem, calculateContractTotal, calculateBalanceDue } from "@/lib/pricing";

// POST /api/pricing/calculate - Server-side price validation
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { lineItems, discount, downPayment } = body;

  const itemPrices = (lineItems || []).map((item: any) =>
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
