"use client";

import { useFormContext, useWatch } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { CurrencyInput } from "@/components/shared/currency-input";
import { usePricingCalculator } from "@/lib/hooks/use-pricing-calculator";
import { formatCurrency } from "@/lib/pricing";
import { type LineItemFormValues } from "@/lib/validations";

interface ChangeOrderData {
  id: string;
  changeOrderNumber: string;
  priceChangeType: string;
  priceChangeAmount: number;
  originalPrice: number;
  newPrice: number;
  newBalanceDue: number;
}

interface PricingSummaryProps {
  changeOrders?: ChangeOrderData[];
}

export function PricingSummary({ changeOrders }: PricingSummaryProps) {
  const { control, setValue, register } = useFormContext();

  const lineItems = useWatch({ control, name: "lineItems" }) || [];
  const discount = useWatch({ control, name: "discount" }) || 0;
  const downPayment = useWatch({ control, name: "downPayment" }) || 0;

  const { total, contractTotal, balanceDue } = usePricingCalculator({
    lineItems: lineItems.map((item: LineItemFormValues) => ({
      width: Number(item.width) || 0,
      height: Number(item.height) || 0,
      qty: Number(item.qty) || 1,
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
    discount: Number(discount) || 0,
    downPayment: Number(downPayment) || 0,
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
          <span className="text-xl font-bold text-awp-orange-text">
            {formatCurrency(balanceDue)}
          </span>
        </div>

        {changeOrders && changeOrders.length > 0 && (() => {
          // Change orders come sorted desc from API; reverse to show chronologically
          const sorted = [...changeOrders].reverse();
          const last = sorted[sorted.length - 1];
          return (
            <>
              <Separator />
              <div className="flex items-center gap-2">
                <span className="font-medium">Adjusted by Change Orders</span>
                <Badge variant="highlight">
                  {changeOrders.length}
                </Badge>
              </div>
              <div className="space-y-1 text-sm text-muted-foreground">
                {sorted.map((co, i) => (
                  <div key={co.id} className="flex justify-between">
                    <span>
                      CO #{i + 1}{" "}
                      {co.priceChangeType === "increase" && "(Increase)"}
                      {co.priceChangeType === "decrease" && "(Decrease)"}
                      {co.priceChangeType === "no_change" && "(No Change)"}
                    </span>
                    <span>
                      {co.priceChangeType === "increase" && "+"}
                      {co.priceChangeType === "decrease" && "-"}
                      {co.priceChangeType !== "no_change" && formatCurrency(co.priceChangeAmount)}
                      {co.priceChangeType === "no_change" && formatCurrency(0)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center">
                <span className="font-bold">Adjusted Contract Total</span>
                <span className="text-xl font-bold">
                  {formatCurrency(last.newPrice)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-bold">Adjusted Balance Due</span>
                <span className="text-xl font-bold text-awp-orange-text">
                  {formatCurrency(last.newBalanceDue)}
                </span>
              </div>
            </>
          );
        })()}

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
          <Label htmlFor="wfebAccount" className="w-28 shrink-0">WFEB Account</Label>
          <Input
            id="wfebAccount"
            {...register("wfebAccount")}
            placeholder="Account #"
          />
        </div>
      </CardContent>
    </Card>
  );
}
