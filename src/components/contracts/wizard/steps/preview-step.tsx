"use client";

import { useFormContext } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/pricing";
import type { SalesContractDraftValues, LineItemFormValues } from "@/lib/validations";

export function PreviewStep() {
  const { watch } = useFormContext();
  const formData = watch() as SalesContractDraftValues;

  const subtotal = (formData.lineItems || []).reduce(
    (sum: number, item: LineItemFormValues | undefined) => sum + (item?.price || 0),
    0
  );
  const contractTotal = Math.max(0, subtotal - (formData.discount || 0));
  const balanceDue = Math.max(0, contractTotal - (formData.downPayment || 0));

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold mb-4">Contract Preview</h2>

      {/* Customer Information */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div><strong>Name:</strong> {formData.customerName || "-"}</div>
          <div><strong>Email:</strong> {formData.customerEmail || "-"}</div>
          <div><strong>Phone:</strong> {formData.customerPhone || "-"}</div>
          <div><strong>Address:</strong> {formData.jobAddress || "-"}</div>
          {formData.customerCity && (
            <div>
              <strong>City/State/ZIP:</strong> {formData.customerCity}
              {formData.customerZip && `, ${formData.customerZip}`}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Line Items Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Products ({formData.lineItems?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {formData.lineItems?.map((item: LineItemFormValues, index: number) => (
              <div key={item.id || index} className="flex justify-between text-sm py-2 border-b">
                <div>
                  <span className="font-medium">{item.location || `Item ${index + 1}`}</span>
                  <span className="text-muted-foreground ml-2">
                    {item.type} - {item.series || "-"} {item.function || "-"}
                  </span>
                  <span className="text-muted-foreground ml-2">
                    {item.width}&quot;x{item.height}&quot; x {item.qty}
                  </span>
                </div>
                <span className="font-medium">{formatCurrency(item.price || 0)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pricing Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Pricing Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          {formData.discount > 0 && (
            <div className="flex justify-between">
              <span>Discount</span>
              <span className="text-destructive">-{formatCurrency(formData.discount)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-lg border-t pt-2">
            <span>Contract Total</span>
            <span>{formatCurrency(contractTotal)}</span>
          </div>
          {formData.downPayment > 0 && (
            <div className="flex justify-between">
              <span>Down Payment</span>
              <span>-{formatCurrency(formData.downPayment)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-lg border-t pt-2">
            <span>Balance Due</span>
            <span className="text-awp-orange-text">{formatCurrency(balanceDue)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Notes Preview */}
      {(formData.measurementNotes || formData.contractNotes || formData.customerNotes) && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.measurementNotes && (
              <div>
                <Label className="text-muted-foreground">Measurement Notes</Label>
                <p className="text-sm">{formData.measurementNotes}</p>
              </div>
            )}
            {formData.contractNotes && (
              <div>
                <Label className="text-muted-foreground">Contract Notes</Label>
                <p className="text-sm">{formData.contractNotes}</p>
              </div>
            )}
            {formData.customerNotes && (
              <div>
                <Label className="text-muted-foreground">Customer Notes</Label>
                <p className="text-sm">{formData.customerNotes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
