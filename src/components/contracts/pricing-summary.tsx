"use client";

import { useFormContext, useWatch } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { CurrencyInput } from "@/components/shared/currency-input";
import { usePricingCalculator } from "@/lib/hooks/use-pricing-calculator";
import { formatCurrency } from "@/lib/pricing";

export function PricingSummary() {
  const { control, setValue, register } = useFormContext();

  const lineItems = useWatch({ control, name: "lineItems" }) || [];
  const discount = useWatch({ control, name: "discount" }) || 0;
  const downPayment = useWatch({ control, name: "downPayment" }) || 0;

  const { total, contractTotal, balanceDue } = usePricingCalculator({
    lineItems: lineItems.map((item: any) => ({
      width: parseFloat(item.width) || 0,
      height: parseFloat(item.height) || 0,
      qty: parseInt(item.qty) || 1,
      color: item.color || "White",
      series: item.series || "Patriot",
      frame: item.frame || "Nail Fin",
      function: item.function || "Slider",
      temperedGlass: !!item.temperedGlass,
      obscuredGlass: !!item.obscuredGlass,
      customShape: !!item.customShape,
      wrap: !!item.wrap,
      coated: !!item.coated,
      awpShutterRnr: !!item.awpShutterRnr,
    })),
    discount: parseFloat(discount) || 0,
    downPayment: parseFloat(downPayment) || 0,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pricing Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="text-lg font-semibold">{formatCurrency(total)}</span>
        </div>

        <div className="flex items-center gap-4">
          <Label className="w-28 shrink-0">Discount</Label>
          <CurrencyInput
            value={discount}
            onChange={(v) => setValue("discount", v, { shouldDirty: true })}
          />
        </div>

        <Separator />

        <div className="flex justify-between items-center">
          <span className="font-medium">Contract Total</span>
          <span className="text-xl font-bold">
            {formatCurrency(contractTotal)}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <Label className="w-28 shrink-0">Down Payment</Label>
          <CurrencyInput
            value={downPayment}
            onChange={(v) => setValue("downPayment", v, { shouldDirty: true })}
          />
        </div>

        <Separator />

        <div className="flex justify-between items-center">
          <span className="font-medium">Balance Due</span>
          <span className="text-xl font-bold text-primary">
            {formatCurrency(balanceDue)}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <Label className="w-28 shrink-0">Finance Balance</Label>
          <CurrencyInput
            {...register("financeBalance", { valueAsNumber: true })}
            value={useWatch({ control, name: "financeBalance" }) || 0}
            onChange={(v) =>
              setValue("financeBalance", v, { shouldDirty: true })
            }
          />
        </div>

        <div className="flex items-center gap-4">
          <Label className="w-28 shrink-0">WFEB Account</Label>
          <input
            {...register("wfebAccount")}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            placeholder="Account #"
          />
        </div>
      </CardContent>
    </Card>
  );
}
