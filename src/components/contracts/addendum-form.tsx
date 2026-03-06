"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2, Loader2, Send } from "lucide-react";
import { SignaturePad } from "@/components/shared/signature-pad";
import { addendumSchema, type AddendumFormValues } from "@/lib/validations";
import { FORM_OPTIONS } from "@/lib/constants";
import { formatCurrency } from "@/lib/pricing";

interface AddendumFormProps {
  contract: {
    id: string;
    contractNumber: string;
    customerName: string | null;
    contractTotal: number;
  };
}

const INSTALL_FIELDS = [
  { key: "installRemoveOld", label: "Remove old windows/doors" },
  { key: "installHaulAway", label: "Haul away old windows/doors" },
  { key: "installInteriorTrim", label: "Install interior trim" },
  { key: "installExteriorTrim", label: "Install exterior trim" },
  { key: "installCaulkSeal", label: "Caulk and seal" },
  { key: "installScreens", label: "Install screens" },
  { key: "installHardware", label: "Install hardware" },
  { key: "installWeatherstrip", label: "Install weatherstripping" },
  { key: "installCleanup", label: "Job site cleanup" },
  { key: "installOther", label: "Other (see notes)" },
] as const;

export function AddendumForm({ contract }: AddendumFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
  } = useForm<AddendumFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Zod v4 + @hookform/resolvers type mismatch
    resolver: zodResolver(addendumSchema) as any,
    defaultValues: {
      contractId: contract.id,
      products: [{ type: "", qty: 0, width: 0, height: 0, notes: "" }],
      installRemoveOld: false,
      installHaulAway: false,
      installInteriorTrim: false,
      installExteriorTrim: false,
      installCaulkSeal: false,
      installScreens: false,
      installHardware: false,
      installWeatherstrip: false,
      installCleanup: false,
      installOther: false,
      ackMeasurements: false,
      ackSpecifications: false,
      ackPricing: false,
      ackTerms: false,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "products",
  });

  async function onSubmit(data: AddendumFormValues) {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/contracts/${contract.id}/addendum`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        toast.success("Addendum created successfully");
        router.push(`/contracts/${contract.id}/edit`);
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to create addendum");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <h1 className="text-2xl font-bold">New Addendum</h1>

      {/* Parent contract info */}
      <Card>
        <CardHeader>
          <CardTitle>Parent Contract</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Contract #:</span>{" "}
              <span className="font-medium">
                {contract.contractNumber.slice(0, 8)}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Customer:</span>{" "}
              <span className="font-medium">{contract.customerName}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Total:</span>{" "}
              <span className="font-medium">
                {formatCurrency(contract.contractTotal)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Products</CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              append({ type: "", qty: 0, width: 0, height: 0, notes: "" })
            }
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Product
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end"
            >
              <div className="md:col-span-2 space-y-1">
                <Label>Type</Label>
                <Select
                  value={watch(`products.${index}.type`) || ""}
                  onValueChange={(v) =>
                    setValue(`products.${index}.type`, v)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {FORM_OPTIONS.addendumProductTypes.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Qty</Label>
                <Input
                  type="number"
                  min={0}
                  {...register(`products.${index}.qty`, {
                    valueAsNumber: true,
                  })}
                />
              </div>
              <div className="space-y-1">
                <Label>Width</Label>
                <Input
                  type="number"
                  step="0.01"
                  {...register(`products.${index}.width`, {
                    valueAsNumber: true,
                  })}
                />
              </div>
              <div className="space-y-1">
                <Label>Height</Label>
                <Input
                  type="number"
                  step="0.01"
                  {...register(`products.${index}.height`, {
                    valueAsNumber: true,
                  })}
                />
              </div>
              <div className="flex items-end gap-2">
                <div className="flex-1 space-y-1">
                  <Label>Notes</Label>
                  <Input {...register(`products.${index}.notes`)} />
                </div>
                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(index)}
                    aria-label="Remove product"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Colors */}
      <Card>
        <CardHeader>
          <CardTitle>Colors</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Interior Color</Label>
              <Select
                value={watch("interiorColor") || ""}
                onValueChange={(v) => setValue("interiorColor", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select color" />
                </SelectTrigger>
                <SelectContent>
                  {FORM_OPTIONS.interiorColors.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Exterior Color</Label>
              <Select
                value={watch("exteriorColor") || ""}
                onValueChange={(v) => setValue("exteriorColor", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select color" />
                </SelectTrigger>
                <SelectContent>
                  {FORM_OPTIONS.exteriorColors.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Custom Description</Label>
              <Input {...register("colorDescription")} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Installation Checklist */}
      <Card>
        <CardHeader>
          <CardTitle>Installation Checklist</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {INSTALL_FIELDS.map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={!!watch(key)}
                  onCheckedChange={(checked) =>
                    setValue(key, !!checked)
                  }
                />
                {label}
              </label>
            ))}
          </div>
          <div className="space-y-2">
            <Label>Installation Notes</Label>
            <Textarea {...register("installNotes")} rows={3} />
          </div>
        </CardContent>
      </Card>

      {/* Acknowledgements */}
      <Card>
        <CardHeader>
          <CardTitle>Acknowledgements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <label className="flex items-start gap-2 text-sm">
              <Checkbox
                checked={!!watch("ackMeasurements")}
                onCheckedChange={(checked) =>
                  setValue("ackMeasurements", !!checked)
                }
                className="mt-0.5"
              />
              I acknowledge that measurements have been verified and are accurate.
            </label>
            <label className="flex items-start gap-2 text-sm">
              <Checkbox
                checked={!!watch("ackSpecifications")}
                onCheckedChange={(checked) =>
                  setValue("ackSpecifications", !!checked)
                }
                className="mt-0.5"
              />
              I acknowledge that product specifications have been reviewed and
              approved.
            </label>
            <label className="flex items-start gap-2 text-sm">
              <Checkbox
                checked={!!watch("ackPricing")}
                onCheckedChange={(checked) =>
                  setValue("ackPricing", !!checked)
                }
                className="mt-0.5"
              />
              I acknowledge that pricing has been reviewed and agreed upon.
            </label>
            <label className="flex items-start gap-2 text-sm">
              <Checkbox
                checked={!!watch("ackTerms")}
                onCheckedChange={(checked) =>
                  setValue("ackTerms", !!checked)
                }
                className="mt-0.5"
              />
              I acknowledge and agree to the terms and conditions of this
              addendum.
            </label>
          </div>
          <div className="space-y-2 max-w-xs">
            <Label>Initials</Label>
            <Input {...register("ackInitials")} placeholder="Initials" />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              checked={!!watch("hasInteriorShutters")}
              onCheckedChange={(checked) => setValue("hasInteriorShutters", !!checked)}
            />
            <Label>Interior Shutters</Label>
          </div>
        </CardContent>
      </Card>

      {/* Referral */}
      <Card>
        <CardHeader>
          <CardTitle>Referral</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Referral Name</Label>
              <Input {...register("referralName")} />
            </div>
            <div className="space-y-2">
              <Label>Referral Phone</Label>
              <Input {...register("referralPhone")} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea {...register("notes")} rows={4} />
        </CardContent>
      </Card>

      {/* Signatures */}
      <Card>
        <CardHeader>
          <CardTitle>Signatures</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <SignaturePad
                label="Contractor Signature"
                value={watch("contractorSignature")}
                onChange={(v) => setValue("contractorSignature", v)}
              />
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  {...register("contractorSignatureDate")}
                />
              </div>
            </div>
            <div className="space-y-4">
              <SignaturePad
                label="Customer Signature"
                value={watch("customerSignature")}
                onChange={(v) => setValue("customerSignature", v)}
              />
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  {...register("customerSignatureDate")}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex justify-center">
        <Button type="submit" size="lg" disabled={submitting}>
          {submitting ? (
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
          ) : (
            <Send className="h-5 w-5 mr-2" />
          )}
          Submit Addendum
        </Button>
      </div>
    </form>
  );
}
