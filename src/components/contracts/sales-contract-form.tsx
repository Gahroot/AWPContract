"use client";

import { useState, useCallback, useEffect } from "react";
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
import { Save, Send, UserCheck, Loader2, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SignaturePad } from "@/components/shared/signature-pad";
import { AutoSaveIndicator } from "@/components/shared/auto-save-indicator";
import { TermsModal } from "@/components/shared/terms-modal";
import { LineItemsTable } from "./line-items-table";
import { PricingSummary } from "./pricing-summary";
import { useAutoSave } from "@/lib/hooks/use-auto-save";
import {
  salesContractDraftSchema,
  type SalesContractDraftValues,
} from "@/lib/validations";
import { FORM_OPTIONS } from "@/lib/constants";
import * as motion from "motion/react-client";

interface ChangeOrderData {
  id: string;
  changeOrderNumber: string;
  priceChangeType: string;
  priceChangeAmount: number;
  originalPrice: number;
  newPrice: number;
  newBalanceDue: number;
}

interface SalesContractFormProps {
  initialData?: Partial<SalesContractDraftValues> & { changeOrders?: ChangeOrderData[] };
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
  const changeOrders = initialData?.changeOrders;

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
          leadTest: initialData.leadTest || "",
          yearBuilt: initialData.yearBuilt || "",
          houseType: initialData.houseType || "",
          measuredBy: initialData.measuredBy || "",
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
                    series: "",
                    frame: "Nail Fin",
                    function: "",
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
          customerState: initialData.customerState || "",
          preferredCommunication: initialData.preferredCommunication || "",
          downPaymentMethod: initialData.downPaymentMethod || "",
          financingOption: initialData.financingOption || "",
          financingLoanId: initialData.financingLoanId || "",
          financingPlan: initialData.financingPlan || "",
          windowsBeingRemoved: initialData.windowsBeingRemoved || "",
          paymentNotes: initialData.paymentNotes || "",
          contractNotes: initialData.contractNotes || "",
          customerNotes: initialData.customerNotes || "",
          customerAcceptedTerms: initialData.customerAcceptedTerms || false,
          brickApplicationQty: initialData.brickApplicationQty || 0,
          stuccoApplicationQty: initialData.stuccoApplicationQty || 0,
          sidingApplicationQty: initialData.sidingApplicationQty || 0,
          foundationApplicationQty: initialData.foundationApplicationQty || 0,
          woodApplicationQty: initialData.woodApplicationQty || 0,
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
              series: "",
              frame: "Nail Fin",
              function: "",
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
          brickApplicationQty: 0,
          stuccoApplicationQty: 0,
          sidingApplicationQty: 0,
          foundationApplicationQty: 0,
          woodApplicationQty: 0,
          marketingSource: [],
        },
  });

  const { register, handleSubmit, setValue, getValues, watch } = methods;

  // Fetch salespeople for dropdowns
  const [salespeople, setSalespeople] = useState<{ id: string; name: string | null; email: string }[]>([]);
  useEffect(() => {
    fetch("/api/users/salespeople")
      .then((res) => (res.ok ? res.json() : []))
      .then(setSalespeople)
      .catch(() => {});
  }, []);

  // Auto-save handler
  const handleAutoSave = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- matches useAutoSave's AnyFormValues type
    async (data: Record<string, any>) => {
      if (!contractId) return;
      const res = await fetch(`/api/contracts/${contractId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(`Auto-save failed: ${res.status}`);
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
          const err = await res.json().catch(() => ({}));
          toast.error(err.error || "Failed to save draft");
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
          const err = await res.json().catch(() => ({}));
          toast.error(err.error || "Failed to create contract");
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

    setSubmitting(true);
    try {
      // Use local variable to avoid React state timing issue
      let currentId = contractId;

      // Save first if not saved
      if (!currentId) {
        const res = await fetch("/api/contracts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          toast.error(err.error || "Failed to save contract");
          return;
        }
        const contract = await res.json();
        currentId = contract.id;
        setContractId(contract.id);
      }

      // Update status using local variable (not stale React state)
      const res = await fetch(`/api/contracts/${currentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, status: "PENDING_SIGNATURE" }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "Failed to update contract status");
        return;
      }

      setPhase("customer");
      toast.success("Ready for customer signature");
    } finally {
      setSubmitting(false);
    }
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

        {/* Change Order Banner */}
        {changeOrders && changeOrders.length > 0 && (
          <div className="flex items-center gap-3 rounded-lg border border-awp-orange/30 bg-awp-orange/10 px-4 py-3">
            <AlertTriangle className="h-5 w-5 text-awp-orange-text shrink-0" />
            <span className="text-sm font-medium">
              This contract has been modified by change orders.
              Adjusted totals are shown in the Pricing Summary below.
            </span>
            <Badge variant="highlight">
              {changeOrders.length} Change Order{changeOrders.length > 1 ? "s" : ""}
            </Badge>
          </div>
        )}

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
              <div className="space-y-2">
                <Label htmlFor="customerState">State</Label>
                <select
                  id="customerState"
                  {...register("customerState")}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">Select state</option>
                  {FORM_OPTIONS.states.map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
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
              <div className="space-y-2 md:col-span-2">
                <Label>Preferred Communication</Label>
                <RadioGroup
                  value={watch("preferredCommunication") || ""}
                  onValueChange={(v) => setValue("preferredCommunication", v, { shouldDirty: true })}
                >
                  <div className="flex gap-4">
                    {FORM_OPTIONS.preferredCommunication.map((method) => (
                      <label key={method} className="flex items-center gap-2 text-sm">
                        <RadioGroupItem value={method} />
                        {method}
                      </label>
                    ))}
                  </div>
                </RadioGroup>
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
                <Label htmlFor="measuredBy">Measured By</Label>
                <Input
                  id="measuredBy"
                  {...register("measuredBy")}
                />
              </div>
              {salespeople.length > 0 && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="salesRepId">Sales Rep (Commission)</Label>
                    <select
                      id="salesRepId"
                      {...register("salesRepId")}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <option value="">Default (current user)</option>
                      {salespeople.map((sp) => (
                        <option key={sp.id} value={sp.id}>
                          {sp.name || sp.email}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="setterId">Setter (Commission)</Label>
                    <select
                      id="setterId"
                      {...register("setterId")}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <option value="">None (self-gen)</option>
                      {salespeople.map((sp) => (
                        <option key={sp.id} value={sp.id}>
                          {sp.name || sp.email}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}
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
            <Separator className="my-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="windowsBeingRemoved">Windows Being Removed</Label>
                <select
                  id="windowsBeingRemoved"
                  {...register("windowsBeingRemoved")}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">Select type</option>
                  {FORM_OPTIONS.windowsBeingRemoved.map((w) => (
                    <option key={w} value={w}>{w}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-4">
              <Label className="mb-2 block">Application Surface Quantities</Label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="brickApplicationQty" className="text-xs text-muted-foreground">Brick</Label>
                  <Input id="brickApplicationQty" type="number" min="0" {...register("brickApplicationQty")} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="stuccoApplicationQty" className="text-xs text-muted-foreground">Stucco</Label>
                  <Input id="stuccoApplicationQty" type="number" min="0" {...register("stuccoApplicationQty")} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="sidingApplicationQty" className="text-xs text-muted-foreground">Siding</Label>
                  <Input id="sidingApplicationQty" type="number" min="0" {...register("sidingApplicationQty")} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="foundationApplicationQty" className="text-xs text-muted-foreground">Foundation</Label>
                  <Input id="foundationApplicationQty" type="number" min="0" {...register("foundationApplicationQty")} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="woodApplicationQty" className="text-xs text-muted-foreground">Wood</Label>
                  <Input id="woodApplicationQty" type="number" min="0" {...register("woodApplicationQty")} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Line Items */}
        <LineItemsTable />

        {/* Section 4: Pricing */}
        <PricingSummary changeOrders={changeOrders} />

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

        {/* Section 6: Notes */}
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
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contractNotes">Contract Notes</Label>
              <Textarea
                id="contractNotes"
                {...register("contractNotes")}
                placeholder="Enter contract notes..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerNotes">Customer Notes / Preferences</Label>
              <Textarea
                id="customerNotes"
                {...register("customerNotes")}
                placeholder="Enter customer notes and preferences..."
                rows={3}
              />
            </div>
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
            <h2 className="text-xl font-bold text-center text-awp-blue">Customer Section</h2>

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
            {watch("paymentMethod") === "finance" && (
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
                <Textarea
                  {...register("paymentNotes")}
                  placeholder="Enter payment notes..."
                  rows={3}
                />
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
                      setValue("customerAcceptedTerms", checked as boolean, {
                        shouldDirty: true,
                      })
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
