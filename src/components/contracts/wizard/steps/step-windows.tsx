"use client";

import { useFormContext, useWatch } from "react-hook-form";
import { LineItemsTable } from "@/components/contracts/line-items-table";
import { formatCurrency } from "@/lib/pricing";

export function StepWindows() {
  const { control } = useFormContext();

  const lineItems = useWatch({ control, name: "lineItems" }) || [];
  const discount = useWatch({ control, name: "discount" }) || 0;

  const windowsCount = lineItems.filter(
    (item: { type?: string }) => item.type === "Window"
  ).length;
  const doorsCount = lineItems.filter(
    (item: { type?: string }) => item.type === "Door"
  ).length;

  const subtotal = lineItems.reduce(
    (sum: number, item: { price?: number; qty?: number }) =>
      sum + (item.price || 0) * (item.qty || 1),
    0
  );

  const discountPerUnit =
    lineItems.length > 0 ? discount / lineItems.length : 0;

  return (
    <div className="space-y-6">
      {/* Summary Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border bg-muted/30 px-5 py-4">
        <div className="flex items-center gap-6">
          <div className="text-center">
            <p className="text-2xl font-bold">{windowsCount}</p>
            <p className="text-xs text-muted-foreground">
              Window{windowsCount !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="h-8 w-px bg-border" />
          <div className="text-center">
            <p className="text-2xl font-bold">{doorsCount}</p>
            <p className="text-xs text-muted-foreground">
              Door{doorsCount !== 1 ? "s" : ""}
            </p>
          </div>
          {discount > 0 && (
            <>
              <div className="h-8 w-px bg-border" />
              <div className="text-center">
                <p className="text-lg font-semibold text-orange-600">
                  {formatCurrency(discountPerUnit)}
                </p>
                <p className="text-xs text-muted-foreground">Discount/Unit</p>
              </div>
            </>
          )}
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold">{formatCurrency(subtotal)}</p>
          <p className="text-xs text-muted-foreground">Subtotal</p>
        </div>
      </div>

      {/* Line Items */}
      <LineItemsTable />
    </div>
  );
}
