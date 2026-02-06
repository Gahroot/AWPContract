"use client";

import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";
import { SignaturePad } from "@/components/shared/signature-pad";
import { CurrencyInput } from "@/components/shared/currency-input";
import { changeOrderSchema, type ChangeOrderFormValues } from "@/lib/validations";
import { formatCurrency } from "@/lib/pricing";

interface ChangeOrderFormProps {
  contract: {
    id: string;
    contractNumber: string;
    customerName: string | null;
    contractTotal: number;
    downPayment: number;
    balanceDue: number;
  };
}

export function ChangeOrderForm({ contract }: ChangeOrderFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, setValue, watch } =
    useForm<ChangeOrderFormValues>({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Zod v4 + @hookform/resolvers type mismatch
      resolver: zodResolver(changeOrderSchema) as any,
      defaultValues: {
        contractId: contract.id,
        changesDescription: "",
        priceChangeType: "no_change",
        priceChangeAmount: 0,
      },
    });

  const priceChangeType = watch("priceChangeType");
  const priceChangeAmount = watch("priceChangeAmount") || 0;

  const { newPrice, newBalanceDue } = useMemo(() => {
    let np = contract.contractTotal;
    if (priceChangeType === "increase") {
      np += priceChangeAmount;
    } else if (priceChangeType === "decrease") {
      np -= priceChangeAmount;
    }
    return {
      newPrice: np,
      newBalanceDue: Math.max(0, np - contract.downPayment),
    };
  }, [priceChangeType, priceChangeAmount, contract]);

  async function onSubmit(data: ChangeOrderFormValues) {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/contracts/${contract.id}/change-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        toast.success("Change order created successfully");
        router.push(`/contracts/${contract.id}/edit`);
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to create change order");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <h1 className="text-2xl font-bold">New Change Order</h1>

      {/* Parent contract info */}
      <Card>
        <CardHeader>
          <CardTitle>Original Contract</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
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
              <span className="text-muted-foreground">Original Price:</span>{" "}
              <span className="font-medium">
                {formatCurrency(contract.contractTotal)}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Balance Due:</span>{" "}
              <span className="font-medium">
                {formatCurrency(contract.balanceDue)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Changes Description */}
      <Card>
        <CardHeader>
          <CardTitle>Description of Changes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            {...register("changesDescription")}
            placeholder="Describe the changes to the original contract..."
            rows={5}
          />
        </CardContent>
      </Card>

      {/* Price Change */}
      <Card>
        <CardHeader>
          <CardTitle>Price Adjustment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup
            value={priceChangeType}
            onValueChange={(v) =>
              setValue("priceChangeType", v as ChangeOrderFormValues["priceChangeType"], { shouldDirty: true })
            }
          >
            <div className="space-y-3">
              <label className="flex items-center gap-2">
                <RadioGroupItem value="no_change" />
                <span className="text-sm">No price change</span>
              </label>
              <label className="flex items-center gap-2">
                <RadioGroupItem value="increase" />
                <span className="text-sm">Price increase</span>
              </label>
              <label className="flex items-center gap-2">
                <RadioGroupItem value="decrease" />
                <span className="text-sm">Price decrease</span>
              </label>
            </div>
          </RadioGroup>

          {priceChangeType !== "no_change" && (
            <div className="max-w-xs space-y-2">
              <Label>
                Amount ({priceChangeType === "increase" ? "+" : "-"})
              </Label>
              <CurrencyInput
                value={priceChangeAmount}
                onChange={(v) =>
                  setValue("priceChangeAmount", v, { shouldDirty: true })
                }
              />
            </div>
          )}

          <Separator />

          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">New Contract Price</span>
              <span className="font-bold text-lg">
                {formatCurrency(newPrice)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">New Balance Due</span>
              <span className="font-bold text-lg text-primary">
                {formatCurrency(newBalanceDue)}
              </span>
            </div>
          </div>
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
                label="Customer Approval"
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
            <div className="space-y-4">
              <SignaturePad
                label="AWP Approval"
                value={watch("awpSignature")}
                onChange={(v) => setValue("awpSignature", v)}
              />
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  {...register("awpSignatureDate")}
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
          Submit Change Order
        </Button>
      </div>
    </form>
  );
}
