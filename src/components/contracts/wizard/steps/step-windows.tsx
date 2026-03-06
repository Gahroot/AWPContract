"use client";

import { useFormContext, useWatch } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LineItemsTable } from "@/components/contracts/line-items-table";
import { formatCurrency } from "@/lib/pricing";

export function StepWindows() {
  const { control } = useFormContext();

  const lineItems = useWatch({ control, name: "lineItems" }) || [];
  const discount = useWatch({ control, name: "discount" }) || 0;

  // Calculate summary stats
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
  const contractTotal = Math.max(0, subtotal - (discount || 0));

  return (
    <div className="space-y-6">
      {/* Summary Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="text-sm px-3 py-1">
                {windowsCount} Window{windowsCount !== 1 ? "s" : ""}
              </Badge>
              <Badge variant="outline" className="text-sm px-3 py-1">
                {doorsCount} Door{doorsCount !== 1 ? "s" : ""}
              </Badge>
              <Badge variant="secondary" className="text-sm px-3 py-1">
                {lineItems.length} Item{lineItems.length !== 1 ? "s" : ""}
              </Badge>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-sm">
                <span className="text-muted-foreground">Discount: </span>
                <span className="font-medium">{formatCurrency(discount)}</span>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Subtotal: </span>
                <span className="font-semibold">{formatCurrency(subtotal)}</span>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Contract Total: </span>
                <span className="font-bold text-lg">{formatCurrency(contractTotal)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Line Items Table */}
      <Card>
        <CardHeader>
          <CardTitle>Windows & Doors</CardTitle>
        </CardHeader>
        <CardContent>
          <LineItemsTable />
        </CardContent>
      </Card>
    </div>
  );
}
