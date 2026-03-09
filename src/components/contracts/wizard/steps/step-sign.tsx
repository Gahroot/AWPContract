"use client";

import { useFormContext } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { SignaturePad } from "@/components/shared/signature-pad";
import { TermsModal } from "@/components/shared/terms-modal";
import { Button } from "@/components/ui/button";
import { Send, Loader2 } from "lucide-react";

interface StepSignProps {
  submitting?: boolean;
  onSubmit?: () => void;
  contractId?: string | null;
}

export function StepSign({ submitting = false, onSubmit }: StepSignProps) {
  const { watch, setValue } = useFormContext();

  const contractorSignature = watch("contractorSignature") || "";
  const contractorSignatureDate = watch("contractorSignatureDate") || "";
  const customerSignature = watch("customerSignature") || "";
  const customerSignatureDate = watch("customerSignatureDate") || "";
  const customerAcceptedTerms = watch("customerAcceptedTerms") || false;

  const isContractorSigned = !!contractorSignature;
  const isCustomerSigned = !!customerSignature;
  const canSubmit = isCustomerSigned && customerAcceptedTerms;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Signatures & Submission</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Contractor Signature Section */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold">Contractor Signature</h3>
            <SignaturePad
              label="Contractor Signature"
              value={contractorSignature}
              onChange={(value) => setValue?.("contractorSignature", value, { shouldDirty: true })}
              required={!isContractorSigned}
              disabled={isContractorSigned}
            />
            <div className="space-y-2 max-w-xs">
              <Label>Date</Label>
              <Input
                type="date"
                value={contractorSignatureDate}
                onChange={(e) => setValue?.("contractorSignatureDate", e.target.value, { shouldDirty: true })}
                disabled={isContractorSigned}
              />
            </div>
            {isContractorSigned && (
              <p className="text-sm text-green-600 dark:text-green-400">
                Contractor signature recorded
              </p>
            )}
          </div>

          {/* Customer Signature Section */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold">Customer Signature</h3>
            <SignaturePad
              label="Customer Signature"
              value={customerSignature}
              onChange={(value) => setValue?.("customerSignature", value, { shouldDirty: true })}
              required
            />
            <div className="space-y-2 max-w-xs">
              <Label>Date</Label>
              <Input
                type="date"
                value={customerSignatureDate}
                onChange={(e) => setValue?.("customerSignatureDate", e.target.value, { shouldDirty: true })}
              />
            </div>
          </div>

          {/* Terms & Conditions */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold">Terms & Conditions</h3>
            <div className="flex items-start gap-3 p-4 border rounded-md bg-muted/30">
              <Checkbox
                id="customerAcceptedTerms"
                checked={customerAcceptedTerms}
                onCheckedChange={(checked) =>
                  setValue?.("customerAcceptedTerms", checked as boolean, { shouldDirty: true })
                }
              />
              <div className="flex items-center gap-2 flex-wrap">
                <Label htmlFor="customerAcceptedTerms" className="cursor-pointer">
                  I have read and agree to the Terms & Conditions
                </Label>
                <TermsModal />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex flex-col items-center gap-3 pt-4">
            <Button
              type="button"
              size="lg"
              onClick={onSubmit}
              disabled={!canSubmit || submitting}
              className="min-w-48"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-5 w-5 mr-2" />
                  Submit Contract
                </>
              )}
            </Button>

            {!canSubmit && !submitting && (
              <p className="text-sm text-muted-foreground">
                {!isCustomerSigned
                  ? "Please provide customer signature to submit"
                  : "Please accept the terms and conditions to submit"}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Signature Summary Card */}
      {(isContractorSigned || isCustomerSigned) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Signature Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    isContractorSigned ? "bg-green-500" : "bg-muted"
                  }`}
                />
                <span>Contractor: {isContractorSigned ? "Signed" : "Pending"}</span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    isCustomerSigned ? "bg-green-500" : "bg-muted"
                  }`}
                />
                <span>Customer: {isCustomerSigned ? "Signed" : "Pending"}</span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    customerAcceptedTerms ? "bg-green-500" : "bg-muted"
                  }`}
                />
                <span>Terms: {customerAcceptedTerms ? "Accepted" : "Pending"}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
