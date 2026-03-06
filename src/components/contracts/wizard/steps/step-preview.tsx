"use client";

import { useFormContext } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/pricing";

interface LineItemDisplay {
  id?: string;
  location?: string;
  type?: string;
  function?: string;
  qty: number;
  width: number;
  height: number;
  color?: string;
  series?: string;
  price: number;
}

export function StepPreview() {
  const { watch } = useFormContext();

  const customerName = watch("customerName") || "";
  const customerPhone = watch("customerPhone") || "";
  const customerEmail = watch("customerEmail") || "";
  const jobAddress = watch("jobAddress") || "";
  const billingAddress = watch("billingAddress") || "Same as job address";
  const customerCity = watch("customerCity") || "";
  const customerState = watch("customerState") || "";
  const customerZip = watch("customerZip") || "";

  const salesman = watch("salesman") || "";
  const measuredBy = watch("measuredBy") || "";
  const yearBuilt = watch("yearBuilt") || "";
  const houseType = watch("houseType") || "";
  const windowsBeingRemoved = watch("windowsBeingRemoved") || "";

  const lineItems = (watch("lineItems") || []) as LineItemDisplay[];
  const discount = watch("discount") || 0;
  const downPayment = watch("downPayment") || 0;

  const contractNotes = watch("contractNotes") || "";
  const customerNotes = watch("customerNotes") || "";
  const measurementNotes = watch("measurementNotes") || "";

  // Calculate totals
  const subtotal = lineItems.reduce((sum, item) => sum + (item.price || 0), 0);
  const totalAfterDiscount = subtotal - discount;
  const balanceDue = totalAfterDiscount - downPayment;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Contract Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Customer Information */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Customer Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Name:</span>{" "}
                <span className="font-medium">{customerName || "—"}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Phone:</span>{" "}
                <span className="font-medium">{customerPhone || "—"}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Email:</span>{" "}
                <span className="font-medium">{customerEmail || "—"}</span>
              </div>
              <div>
                <span className="text-muted-foreground">City/State/ZIP:</span>{" "}
                <span className="font-medium">
                  {[customerCity, customerState, customerZip].filter(Boolean).join(", ") || "—"}
                </span>
              </div>
              <div className="md:col-span-2">
                <span className="text-muted-foreground">Job Address:</span>{" "}
                <span className="font-medium">{jobAddress || "—"}</span>
              </div>
              <div className="md:col-span-2">
                <span className="text-muted-foreground">Billing Address:</span>{" "}
                <span className="font-medium">{billingAddress}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Job Details */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Job Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Salesman:</span>{" "}
                <span className="font-medium">{salesman || "—"}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Measured By:</span>{" "}
                <span className="font-medium">{measuredBy || "—"}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Year Built:</span>{" "}
                <span className="font-medium">{yearBuilt || "—"}</span>
              </div>
              <div>
                <span className="text-muted-foreground">House Type:</span>{" "}
                <span className="font-medium">{houseType || "—"}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Windows Being Removed:</span>{" "}
                <span className="font-medium">{windowsBeingRemoved || "—"}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Line Items Summary */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Line Items ({lineItems.length})
            </h3>
            {lineItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">No line items added.</p>
            ) : (
              <div className="border rounded-md overflow-hidden">
                <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-muted/50 text-xs font-semibold">
                  <div className="col-span-3">Location/Type</div>
                  <div className="col-span-2 text-center">Qty</div>
                  <div className="col-span-2 text-center">Size</div>
                  <div className="col-span-2 text-center">Color</div>
                  <div className="col-span-3 text-right">Price</div>
                </div>
                {lineItems.map((item, index) => (
                  <div
                    key={item.id || index}
                    className="grid grid-cols-12 gap-2 px-4 py-2 text-sm border-t"
                  >
                    <div className="col-span-3">
                      <div className="font-medium">{item.location || `Item ${index + 1}`}</div>
                      <div className="text-xs text-muted-foreground">{item.function || item.type}</div>
                    </div>
                    <div className="col-span-2 text-center flex items-center justify-center">
                      {item.qty}
                    </div>
                    <div className="col-span-2 text-center flex items-center justify-center text-xs">
                      {item.width}&quot; &times; {item.height}&quot;
                    </div>
                    <div className="col-span-2 text-center flex items-center justify-center text-xs">
                      <Badge variant="outline">{item.color}</Badge>
                    </div>
                    <div className="col-span-3 text-right flex items-center justify-end font-medium">
                      {formatCurrency(item.price)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Pricing Summary */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Pricing Summary
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-destructive">
                  <span className="text-muted-foreground">Discount:</span>
                  <span className="font-medium">-{formatCurrency(discount)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-base">
                <span>Total:</span>
                <span>{formatCurrency(totalAfterDiscount)}</span>
              </div>
              {downPayment > 0 && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Down Payment:</span>
                    <span className="font-medium">-{formatCurrency(downPayment)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-base pt-2 border-t">
                    <span>Balance Due:</span>
                    <span>{formatCurrency(balanceDue)}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          <Separator />

          {/* Notes */}
          {(contractNotes || customerNotes || measurementNotes) && (
            <>
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Notes
                </h3>
                <div className="space-y-3 text-sm">
                  {measurementNotes && (
                    <div>
                      <span className="text-muted-foreground font-medium">Measurement Notes:</span>
                      <p className="mt-1">{measurementNotes}</p>
                    </div>
                  )}
                  {contractNotes && (
                    <div>
                      <span className="text-muted-foreground font-medium">Contract Notes:</span>
                      <p className="mt-1">{contractNotes}</p>
                    </div>
                  )}
                  {customerNotes && (
                    <div>
                      <span className="text-muted-foreground font-medium">Customer Notes:</span>
                      <p className="mt-1">{customerNotes}</p>
                    </div>
                  )}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Addendum Fields (if applicable) */}
          {watch("installByAWD") !== undefined && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Addendum Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {watch("installByAWD") && (
                  <div>
                    <Badge variant="success">Install by AWD</Badge>
                  </div>
                )}
                {watch("measurementsTakenBy") && (
                  <div>
                    <span className="text-muted-foreground">Measurements By:</span>{" "}
                    <span className="font-medium">{watch("measurementsTakenBy")}</span>
                  </div>
                )}
                {watch("hasShutters") && (
                  <div>
                    <Badge variant="outline">Has Interior Shutters</Badge>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
