"use client";

import { useMemo } from "react";
import {
  calculateLineItem,
  calculateContractTotal,
  calculateBalanceDue,
  type LineItemInput,
} from "@/lib/pricing";

interface UsePricingCalculatorOptions {
  lineItems: LineItemInput[];
  discount: number;
  downPayment: number;
}

export function usePricingCalculator({
  lineItems,
  discount,
  downPayment,
}: UsePricingCalculatorOptions) {
  return useMemo(() => {
    const itemPrices = lineItems.map((item) => calculateLineItem(item));
    const subtotal = itemPrices.reduce((sum, price) => sum + price, 0);
    const total = Math.round(subtotal * 100) / 100;
    const contractTotal = calculateContractTotal(total, discount);
    const balanceDue = calculateBalanceDue(contractTotal, downPayment);

    return {
      itemPrices,
      total,
      contractTotal,
      balanceDue,
    };
  }, [lineItems, discount, downPayment]);
}
