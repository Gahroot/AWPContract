"use client";

import { useFormContext, useWatch } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { PricingSummary } from "@/components/contracts/pricing-summary";
import { CommissionPreview } from "@/components/contracts/commission-preview";
import { CurrencyInput } from "@/components/shared/currency-input";
import { FORM_OPTIONS } from "@/lib/constants";
import { formatCurrency } from "@/lib/pricing";
import { usePricingCalculator } from "@/lib/hooks/use-pricing-calculator";

export function StepOptionsPricing() {
  const { control, setValue, register, watch } = useFormContext();

  const lineItems = useWatch({ control, name: "lineItems" }) || [];
  const discount = useWatch({ control, name: "discount" }) || 0;
  const downPayment = useWatch({ control, name: "downPayment" }) || 0;
  const paymentMethod = watch("paymentMethod") || "";

  const { contractTotal, balanceDue } = usePricingCalculator({
    lineItems: lineItems.map((item: {
      width?: number;
      height?: number;
      qty?: number;
      color?: string;
      series?: string;
      frame?: string;
      function?: string;
      temperedGlass?: boolean;
      obscuredGlass?: boolean;
      customShape?: boolean;
      wrap?: boolean;
      coated?: boolean;
      awpShutterRnr?: boolean;
    }) => ({
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

  // Quick down payment buttons
  const setDownPaymentPercent = (percent: number) => {
    setValue("downPayment", contractTotal * percent, { shouldDirty: true });
  };

  return (
    <div className="space-y-6">
      {/* Marketing Section */}
      <Card>
        <CardHeader>
          <CardTitle>Marketing</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="planNumber">Plan #</Label>
              <Input {...register("planNumber")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="authNumber">Auth #</Label>
              <Input {...register("authNumber")} />
            </div>
            <div className="space-y-2">
              <Label>Marketing Source</Label>
              <div className="flex flex-wrap gap-3">
                {FORM_OPTIONS.marketingSource.map((source) => (
                  <label key={source} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      {...register("marketingSource")}
                      value={source}
                      className="accent-primary"
                    />
                    {source}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Method */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Method</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={paymentMethod}
            onValueChange={(v) => setValue("paymentMethod", v, { shouldDirty: true })}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
              {FORM_OPTIONS.paymentMethod.map((pm) => (
                <label
                  key={pm.value}
                  className="flex items-center gap-2 border rounded-md p-3 cursor-pointer hover:bg-muted has-[:checked]:border-primary has-[:checked]:bg-accent"
                >
                  <RadioGroupItem value={pm.value} />
                  <span className="text-sm font-medium">{pm.label}</span>
                </label>
              ))}
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Down Payment Method */}
      <Card>
        <CardHeader>
          <CardTitle>Down Payment Method</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={watch("downPaymentMethod") || ""}
            onValueChange={(v) =>
              setValue("downPaymentMethod", v, { shouldDirty: true })
            }
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
              {FORM_OPTIONS.downPaymentMethod.map((pm) => (
                <label
                  key={pm.value}
                  className="flex items-center gap-2 border rounded-md p-3 cursor-pointer hover:bg-muted has-[:checked]:border-primary has-[:checked]:bg-accent"
                >
                  <RadioGroupItem value={pm.value} />
                  <span className="text-sm font-medium">{pm.label}</span>
                </label>
              ))}
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Pricing Summary */}
      <PricingSummary />

      {/* Down Payment Quick Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Down Payment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDownPaymentPercent(0.4)}
            >
              40%
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDownPaymentPercent(0.5)}
            >
              50%
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setValue("downPayment", contractTotal, { shouldDirty: true })}
            >
              100% (Paid in Full)
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setValue("downPayment", 0, { shouldDirty: true })}
            >
              $0 Down
            </Button>
          </div>
          <div className="flex items-center gap-4">
            <Label className="w-28 shrink-0">Custom Amount</Label>
            <CurrencyInput
              value={downPayment}
              onChange={(v) => setValue("downPayment", v, { shouldDirty: true })}
              placeholder="Enter amount"
            />
          </div>
          <Separator />
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Contract Total: </span>
              <span className="font-semibold">{formatCurrency(contractTotal)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Balance Due: </span>
              <span className="font-bold text-lg text-awp-orange-text">
                {formatCurrency(balanceDue)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Financing Details (conditional) */}
      {paymentMethod === "finance" && (
        <Card>
          <CardHeader>
            <CardTitle>Financing Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="financingOption">Financing Company</Label>
                <select
                  id="financingOption"
                  {...register("financingOption")}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">Select company</option>
                  {FORM_OPTIONS.financingOption.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="financingLoanId">Loan ID</Label>
                <Input id="financingLoanId" {...register("financingLoanId")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="financingPlan">Plan Type</Label>
                <Input id="financingPlan" {...register("financingPlan")} />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            {...register("paymentNotes")}
            placeholder="Enter payment notes..."
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Additional Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="measurementNotes">Measurement Notes</Label>
            <Textarea
              id="measurementNotes"
              {...register("measurementNotes")}
              placeholder="Enter measurement notes..."
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="customerNotes">Customer Notes / Preferences</Label>
            <Textarea
              id="customerNotes"
              {...register("customerNotes")}
              placeholder="Enter customer notes and preferences..."
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Commission Preview (admin only) */}
      <CommissionPreview />
    </div>
  );
}
