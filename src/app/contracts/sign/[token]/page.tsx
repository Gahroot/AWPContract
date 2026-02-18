"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { CheckCircle, Loader2 } from "lucide-react";
import { SignaturePad } from "@/components/shared/signature-pad";
import { TermsModal } from "@/components/shared/terms-modal";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/pricing";
import { FORM_OPTIONS } from "@/lib/constants";
import { Toaster } from "@/components/ui/sonner";

export default function ContractSignPage() {
  const params = useParams();
  const token = params.token as string;
  const [contract, setContract] = useState<{
    status: string;
    customerName: string;
    jobAddress: string;
    contractTotal: number;
    balanceDue: number;
    lineItems?: unknown[];
    error?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [signature, setSignature] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetch(`/api/contracts/public/${token}`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load");
        return r.json();
      })
      .then(setContract)
      .catch(() => setError("Something went wrong. Please try again."))
      .finally(() => setLoading(false));
  }, [token]);

  async function handleSign() {
    if (!signature) {
      toast.error("Please provide your signature");
      return;
    }

    if (!acceptedTerms) {
      toast.error("Please accept the Terms & Conditions");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/contracts/public/${token}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerSignature: signature,
          paymentMethod,
          customerAcceptedTerms: true,
        }),
      });

      if (res.ok) {
        setSubmitted(true);
        toast.success("Contract signed successfully!");
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to sign contract");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <Skeleton className="h-16 w-48 mx-auto" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center py-20">
        <h1 className="text-2xl font-bold mb-2">Error</h1>
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (!contract || contract.error) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center py-20">
        <h1 className="text-2xl font-bold mb-2">Contract Not Found</h1>
        <p className="text-muted-foreground">
          This link may be invalid or expired.
        </p>
      </div>
    );
  }

  if (contract.status !== "PENDING_SIGNATURE") {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center py-20">
        <h1 className="text-2xl font-bold mb-2">
          Contract Already Signed
        </h1>
        <p className="text-muted-foreground">
          This contract has already been signed or completed.
        </p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center py-20 space-y-4">
        <CheckCircle className="h-16 w-16 text-awp-blue mx-auto" />
        <h1 className="text-2xl font-bold">Thank You!</h1>
        <p className="text-muted-foreground">
          Your contract has been signed successfully. You will receive a
          copy via email.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-6">
      <div className="text-center">
        <Image
          src="/logo.png"
          alt="AWP"
          width={160}
          height={48}
          className="mx-auto"
        />
      </div>

      <h1 className="text-xl font-bold text-center">Sign Contract</h1>

      {/* Contract Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Contract Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Customer</span>
            <span>{contract.customerName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Address</span>
            <span>{contract.jobAddress}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Items</span>
            <span>{contract.lineItems?.length || 0} product(s)</span>
          </div>
          <Separator />
          <div className="flex justify-between font-medium">
            <span>Contract Total</span>
            <span>{formatCurrency(contract.contractTotal)}</span>
          </div>
          <div className="flex justify-between font-bold text-lg">
            <span>Balance Due</span>
            <span className="text-awp-orange-text">{formatCurrency(contract.balanceDue)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Payment Method */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Method</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
            <div className="grid grid-cols-2 gap-3">
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
          <CardTitle>Your Signature</CardTitle>
        </CardHeader>
        <CardContent>
          <SignaturePad
            label="Customer Signature"
            value={signature}
            onChange={setSignature}
            required
          />
        </CardContent>
      </Card>

      {/* Terms & Conditions */}
      <Card>
        <CardHeader>
          <CardTitle>Terms & Conditions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-3">
            <Checkbox
              id="acceptedTerms"
              checked={acceptedTerms}
              onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
            />
            <div className="flex items-center gap-2 flex-wrap">
              <Label htmlFor="acceptedTerms" className="cursor-pointer">
                I have read and agree to the Terms & Conditions
              </Label>
              <TermsModal />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex justify-center pb-8">
        <Button
          size="lg"
          onClick={handleSign}
          disabled={submitting || !signature || !acceptedTerms}
          className="w-full max-w-sm bg-awp-blue hover:bg-awp-blue/90"
        >
          {submitting ? (
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
          ) : (
            <CheckCircle className="h-5 w-5 mr-2" />
          )}
          Sign & Submit
        </Button>
      </div>

      <Toaster />
    </div>
  );
}
