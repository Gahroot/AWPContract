"use client";

import { useState, useCallback } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Save, Send, UserCheck, Loader2 } from "lucide-react";
import { SignaturePad } from "@/components/shared/signature-pad";
import { AutoSaveIndicator } from "@/components/shared/auto-save-indicator";
import { LineItemsTable } from "./line-items-table";
import { PricingSummary } from "./pricing-summary";
import { useAutoSave } from "@/lib/hooks/use-auto-save";
import {
  salesContractDraftSchema,
  type SalesContractDraftValues,
} from "@/lib/validations";
import { FORM_OPTIONS } from "@/lib/constants";
import * as motion from "motion/react-client";

interface SalesContractFormProps {
  initialData?: Partial<SalesContractDraftValues>;
  contractId?: string;
}

export function SalesContractForm({
  initialData,
  contractId: initialContractId,
}: SalesContractFormProps) {
  const router = useRouter();
  const [contractId, setContractId] = useState<string | null>(
    initialContractId || null
  );
  const [phase, setPhase] = useState<"contractor" | "customer">(
    initialData?.status === "PENDING_SIGNATURE" ? "customer" : "contractor"
  );
  const [submitting, setSubmitting] = useState(false);

  const methods = useForm<SalesContractDraftValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Zod v4 + @hookform/resolvers type mismatch
    resolver: zodResolver(salesContractDraftSchema) as any,
    defaultValues: initialData
      ? {
          customerName: initialData.customerName || "",
          customerPhone: initialData.customerPhone || "",
          customerPhoneAlt: initialData.customerPhoneAlt || "",
          customerEmail: initialData.customerEmail || "",
          jobAddress: initialData.jobAddress || "",
          billingAddress: initialData.billingAddress || "",
          customerCity: initialData.customerCity || "",
          customerZip: initialData.customerZip || "",
          salesman: initialData.salesman || "",
          measurementDate: initialData.measurementDate
            ? new Date(initialData.measurementDate).toISOString().split("T")[0]
            : "",
          leadTest: initialData.leadTest || "",
          yearBuilt: initialData.yearBuilt || "",
          houseType: initialData.houseType || "",
          lineItems:
            (initialData.lineItems?.length ?? 0) > 0
              ? initialData.lineItems!
              : [
                  {
                    location: "",
                    type: "Window",
                    qty: 1,
                    width: 0,
                    height: 0,
                    color: "White",
                    series: "Patriot",
                    frame: "Nail Fin",
                    function: "Slider",
                    temperedGlass: false,
                    obscuredGlass: false,
                    customShape: false,
                    wrap: false,
                    coated: false,
                    awpShutterRnr: false,
                    price: 0,
                    sortOrder: 0,
                  },
                ],
          discount: initialData.discount || 0,
          downPayment: initialData.downPayment || 0,
          financeBalance: initialData.financeBalance || 0,
          wfebAccount: initialData.wfebAccount || "",
          planNumber: initialData.planNumber || "",
          authNumber: initialData.authNumber || "",
          marketingSource: initialData.marketingSource || [],
          paymentMethod: initialData.paymentMethod || "",
          measurementNotes: initialData.measurementNotes || "",
          contractorSignature: initialData.contractorSignature || "",
          contractorSignatureDate: initialData.contractorSignatureDate
            ? new Date(initialData.contractorSignatureDate)
                .toISOString()
                .split("T")[0]
            : "",
        }
      : {
          lineItems: [
            {
              location: "",
              type: "Window",
              qty: 1,
              width: 0,
              height: 0,
              color: "White",
              series: "Patriot",
              frame: "Nail Fin",
              function: "Slider",
              temperedGlass: false,
              obscuredGlass: false,
              customShape: false,
              wrap: false,
              coated: false,
              awpShutterRnr: false,
              price: 0,
              sortOrder: 0,
            },
          ],
          discount: 0,
          downPayment: 0,
          financeBalance: 0,
          marketingSource: [],
        },
  });

  const { register, handleSubmit, setValue, getValues, watch } = methods;

  // Auto-save handler
  const handleAutoSave = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- matches useAutoSave's AnyFormValues type
    async (data: Record<string, any>) => {
      if (!contractId) return;
      await fetch(`/api/contracts/${contractId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    },
    [contractId]
  );

  const { saving, lastSaved } = useAutoSave({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- matches useAutoSave's AnyFormValues type
    watch: watch as unknown as import("react-hook-form").UseFormWatch<Record<string, any>>,
    contractId,
    onSave: handleAutoSave,
    enabled: !!contractId,
  });

  // Save Draft
  async function onSaveDraft() {
    const data = getValues();
    setSubmitting(true);
    try {
      if (contractId) {
        const res = await fetch(`/api/contracts/${contractId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (res.ok) {
          toast.success("Draft saved");
        } else {
          toast.error("Failed to save draft");
        }
      } else {
        const res = await fetch("/api/contracts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (res.ok) {
          const contract = await res.json();
          setContractId(contract.id);
          toast.success("Contract created");
          router.replace(`/contracts/${contract.id}/edit`);
        } else {
          toast.error("Failed to create contract");
        }
      }
    } finally {
      setSubmitting(false);
    }
  }

  // Ready for Customer
  async function onReadyForCustomer() {
    const data = getValues();

    // Validate contractor sections
    if (!data.contractorSignature) {
      toast.error("Contractor signature is required");
      return;
    }

    // Save first if not saved
    if (!contractId) {
      const res = await fetch("/api/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        toast.error("Failed to save contract");
        return;
      }
      const contract = await res.json();
      setContractId(contract.id);
    }

    // Update status
    if (contractId) {
      await fetch(`/api/contracts/${contractId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, status: "PENDING_SIGNATURE" }),
      });
    }

    setPhase("customer");
    toast.success("Ready for customer signature");
  }

  // Submit Contract
  async function onSubmit(data: SalesContractDraftValues) {
    if (!contractId) {
      toast.error("Please save the contract first");
      return;
    }

    if (!data.customerSignature) {
      toast.error("Customer signature is required");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/contracts/${contractId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        await res.json();
        toast.success("Contract submitted successfully");
        router.push("/");
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to submit contract");
      }
    } finally {
      setSubmitting(false);
    }
  }

  const customerSignature = watch("customerSignature");
  const marketingSource = watch("marketingSource") || [];

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h1 className="text-2xl font-bold">
            {contractId ? "Edit Contract" : "New Sales Contract"}
          </h1>
          <div className="flex items-center gap-3">
            <AutoSaveIndicator saving={saving} lastSaved={lastSaved} />
            <Button
              type="button"
              variant="outline"
              onClick={onSaveDraft}
              disabled={submitting}
            >
              <Save className="h-4 w-4 mr-2" />
              Save Draft
            </Button>
          </div>
        </div>

        {/* Section 1: Customer Info */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customerName">
                  Customer Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="customerName"
                  {...register("customerName")}
                  placeholder="Full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerEmail">Email</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  {...register("customerEmail")}
                  placeholder="customer@email.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerPhone">Phone</Label>
                <Input
                  id="customerPhone"
                  {...register("customerPhone")}
                  placeholder="(801) 555-0000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerPhoneAlt">Alt Phone</Label>
                <Input
                  id="customerPhoneAlt"
                  {...register("customerPhoneAlt")}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="jobAddress">Job Address</Label>
                <Input
                  id="jobAddress"
                  {...register("jobAddress")}
                  placeholder="Street address"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerCity">City</Label>
                <Input id="customerCity" {...register("customerCity")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerZip">ZIP</Label>
                <Input id="customerZip" {...register("customerZip")} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="billingAddress">
                  Billing Address (if different)
                </Label>
                <Input
                  id="billingAddress"
                  {...register("billingAddress")}
                  placeholder="Leave blank if same as job address"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Job Details */}
        <Card>
          <CardHeader>
            <CardTitle>Job Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="salesman">Salesman</Label>
                <Input id="salesman" {...register("salesman")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="measurementDate">Measurement Date</Label>
                <Input
                  id="measurementDate"
                  type="date"
                  {...register("measurementDate")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="leadTest">Lead Test</Label>
                <Switch
                  id="leadTest"
                  checked={watch("leadTest") === "Yes"}
                  onCheckedChange={(checked) =>
                    setValue("leadTest", checked ? "Yes" : "", { shouldDirty: true })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="yearBuilt">Year Built</Label>
                <Input id="yearBuilt" {...register("yearBuilt")} />
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <Label>House Type</Label>
              <div className="flex flex-wrap gap-4">
                {FORM_OPTIONS.houseType.map((type) => (
                  <label key={type} className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      value={type}
                      {...register("houseType")}
                      className="accent-primary"
                    />
                    {type}
                  </label>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Line Items */}
        <LineItemsTable />

        {/* Section 4: Pricing */}
        <PricingSummary />

        {/* Section 5: Marketing */}
        <Card>
          <CardHeader>
            <CardTitle>Marketing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Plan #</Label>
                <Input {...register("planNumber")} />
              </div>
              <div className="space-y-2">
                <Label>Auth #</Label>
                <Input {...register("authNumber")} />
              </div>
              <div className="space-y-2">
                <Label>Marketing Source</Label>
                <div className="flex flex-wrap gap-3">
                  {FORM_OPTIONS.marketingSource.map((source) => (
                    <label
                      key={source}
                      className="flex items-center gap-2 text-sm"
                    >
                      <Checkbox
                        checked={marketingSource.includes(source)}
                        onCheckedChange={(checked) => {
                          const current = marketingSource || [];
                          setValue(
                            "marketingSource",
                            checked
                              ? [...current, source]
                              : current.filter((s: string) => s !== source),
                            { shouldDirty: true }
                          );
                        }}
                      />
                      {source}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 6: Measurement Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Measurement Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              {...register("measurementNotes")}
              placeholder="Enter measurement notes..."
              rows={4}
            />
          </CardContent>
        </Card>

        {/* Section 7: Contractor Signature */}
        <Card>
          <CardHeader>
            <CardTitle>Contractor Signature</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <SignaturePad
              label="Contractor Signature"
              value={watch("contractorSignature")}
              onChange={(v) =>
                setValue("contractorSignature", v, { shouldDirty: true })
              }
              required
            />
            <div className="space-y-2 max-w-xs">
              <Label>Date</Label>
              <Input
                type="date"
                {...register("contractorSignatureDate")}
              />
            </div>
          </CardContent>
        </Card>

        {/* Ready for Customer Button */}
        {phase === "contractor" && (
          <div className="flex justify-center">
            <Button
              type="button"
              size="lg"
              onClick={onReadyForCustomer}
              disabled={submitting}
            >
              <UserCheck className="h-5 w-5 mr-2" />
              Ready for Customer
            </Button>
          </div>
        )}

        {/* Customer sections (visible after Ready for Customer) */}
        {phase === "customer" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <Separator />
            <h2 className="text-xl font-bold text-center">Customer Section</h2>

            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Method</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={watch("paymentMethod") || ""}
                  onValueChange={(v) =>
                    setValue("paymentMethod", v, { shouldDirty: true })
                  }
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

            {/* Customer Signature */}
            <Card>
              <CardHeader>
                <CardTitle>Customer Signature</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <SignaturePad
                  label="Customer Signature"
                  value={customerSignature}
                  onChange={(v) =>
                    setValue("customerSignature", v, { shouldDirty: true })
                  }
                  required
                />
                <div className="space-y-2 max-w-xs">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={
                      watch("customerSignatureDate") ||
                      new Date().toISOString().split("T")[0]
                    }
                    onChange={(e) =>
                      setValue("customerSignatureDate", e.target.value, {
                        shouldDirty: true,
                      })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Submit */}
            <div className="flex justify-center">
              <Button
                type="submit"
                size="lg"
                disabled={submitting || !customerSignature}
              >
                {submitting ? (
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                ) : (
                  <Send className="h-5 w-5 mr-2" />
                )}
                Submit Contract
              </Button>
            </div>
          </motion.div>
        )}
      </form>
    </FormProvider>
  );
}
