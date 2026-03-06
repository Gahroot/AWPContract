"use client";

import { useFormContext, useWatch } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { SignaturePad } from "@/components/shared/signature-pad";
import { TermsModal } from "@/components/shared/terms-modal";
import { Separator } from "@/components/ui/separator";
import { FORM_OPTIONS } from "@/lib/constants";

export function SignStep() {
  const { register, setValue, watch } = useFormContext();
  const marketingSource = useWatch({ name: "marketingSource" }) || [];
  const paymentMethod = useWatch({ name: "paymentMethod" });

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold mb-4">Finalize & Sign</h2>

      {/* Contractor Signature */}
      <Card>
        <CardHeader>
          <CardTitle>Contractor Signature</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <SignaturePad
            label="Contractor Signature"
            value={watch("contractorSignature")}
            onChange={(v) => setValue("contractorSignature", v, { shouldDirty: true })}
            required
          />
          <div className="space-y-2 max-w-xs">
            <Label>Date</Label>
            <Input type="date" {...register("contractorSignatureDate")} />
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
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
            <Label htmlFor="contractNotes">Contract Notes</Label>
            <Textarea
              id="contractNotes"
              {...register("contractNotes")}
              placeholder="Enter contract notes..."
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

      {/* Marketing Source */}
      <Card>
        <CardHeader>
          <CardTitle>Marketing Source</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {FORM_OPTIONS.marketingSource.map((source) => (
              <label key={source} className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox
                  checked={marketingSource.includes(source)}
                  onCheckedChange={(checked) => {
                    const current = marketingSource || [];
                    setValue(
                      "marketingSource",
                      checked ? [...current, source] : current.filter((s: string) => s !== source),
                      { shouldDirty: true }
                    );
                  }}
                />
                {source}
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Customer Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-center text-awp-blue">Customer Section</h3>

        {/* Payment Method */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Method</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={watch("paymentMethod") || ""}
              onValueChange={(v) => setValue("paymentMethod", v, { shouldDirty: true })}
            >
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {FORM_OPTIONS.paymentMethod.map((pm) => (
                  <label
                    key={pm.value}
                    className="flex items-center gap-2 border rounded-md p-3 cursor-pointer hover:bg-muted"
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
              onValueChange={(v) => setValue("downPaymentMethod", v, { shouldDirty: true })}
            >
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {FORM_OPTIONS.downPaymentMethod.map((pm) => (
                  <label
                    key={pm.value}
                    className="flex items-center gap-2 border rounded-md p-3 cursor-pointer hover:bg-muted"
                  >
                    <RadioGroupItem value={pm.value} />
                    <span className="text-sm font-medium">{pm.label}</span>
                  </label>
                ))}
              </div>
            </RadioGroup>
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
                      <option key={f} value={f}>{f}</option>
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
            <Textarea {...register("paymentNotes")} placeholder="Enter payment notes..." rows={2} />
          </CardContent>
        </Card>

        {/* Customer Signature */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Signature</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <SignaturePad
              label="Customer Signature"
              value={watch("customerSignature")}
              onChange={(v) => setValue("customerSignature", v, { shouldDirty: true })}
              required
            />
            <div className="space-y-2 max-w-xs">
              <Label>Date</Label>
              <Input
                type="date"
                value={watch("customerSignatureDate") || new Date().toISOString().split("T")[0]}
                onChange={(e) => setValue("customerSignatureDate", e.target.value, { shouldDirty: true })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Terms & Conditions */}
        <Card>
          <CardHeader>
            <CardTitle>Terms & Conditions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <Checkbox
                id="customerAcceptedTerms"
                checked={watch("customerAcceptedTerms") || false}
                onCheckedChange={(checked) =>
                  setValue("customerAcceptedTerms", checked as boolean, { shouldDirty: true })
                }
              />
              <div className="flex items-center gap-2">
                <Label htmlFor="customerAcceptedTerms" className="cursor-pointer">
                  I have read and agree to the Terms & Conditions
                </Label>
                <TermsModal />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
