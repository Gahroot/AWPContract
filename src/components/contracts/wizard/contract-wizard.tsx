"use client";

import { useState, useCallback, useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { AnimatePresence } from "motion/react";
import {
  WizardHeader,
  WizardStepIndicator,
  WizardNavButtons,
  useWizard,
  type WizardStep,
} from ".";
import {
  salesContractDraftSchema,
  type SalesContractDraftValues,
} from "@/lib/validations";
import { useAutoSave } from "@/lib/hooks/use-auto-save";
import { StepCustomer } from "./steps/step-customer";
import { StepWindows } from "./steps/step-windows";
import { StepOptionsPricing } from "./steps/step-options-pricing";
import { StepAddendum } from "./steps/step-addendum";
import { StepPreview } from "./steps/step-preview";
import { StepSign } from "./steps/step-sign";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle, CheckCircle2, Download, Loader2 } from "lucide-react";
import type { TerritoryOption } from "@/components/shared/territory-combobox";

const defaultLineItem = {
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
  gridVerticalLines: 0,
  gridHorizontalLines: 0,
  gridPatternNotes: undefined,
  price: 0,
  sortOrder: 0,
};

function splitCustomerName(fullName: string): [string, string] {
  const trimmed = fullName.trim();
  if (!trimmed) return ["", ""];
  const parts = trimmed.split(" ");
  if (parts.length === 1) return [parts[0], ""];
  return [parts[0], parts.slice(1).join(" ")];
}

function getDefaultValues(
  initialData?: Partial<SalesContractDraftValues>
): SalesContractDraftValues {
  const [firstName, lastName] = splitCustomerName(initialData?.customerName || "");
  return {
    customerName: initialData?.customerName || "",
    customerFirstName: initialData?.customerFirstName || firstName,
    customerLastName: initialData?.customerLastName || lastName,
    customerPhone: initialData?.customerPhone || "",
    customerPhoneAlt: initialData?.customerPhoneAlt || "",
    customerEmail: initialData?.customerEmail || "",
    jobAddress: initialData?.jobAddress || "",
    billingAddress: initialData?.billingAddress || "",
    customerCity: initialData?.customerCity || "",
    customerZip: initialData?.customerZip || "",
    salesman: initialData?.salesman || "",
    leadTest: initialData?.leadTest || "",
    yearBuilt: initialData?.yearBuilt || "",
    houseType: initialData?.houseType || "",
    measuredBy: initialData?.measuredBy || "",
    lineItems:
      initialData && initialData.lineItems && initialData.lineItems.length > 0
        ? initialData.lineItems
        : [{ ...defaultLineItem }],
    discount: initialData?.discount || 0,
    downPayment: initialData?.downPayment || 0,
    financeBalance: initialData?.financeBalance || 0,
    wfebAccount: initialData?.wfebAccount || "",
    planNumber: initialData?.planNumber || "",
    authNumber: initialData?.authNumber || "",
    marketingSource: initialData?.marketingSource || [],
    paymentMethod: initialData?.paymentMethod || "",
    customerState: initialData?.customerState || "",
    preferredCommunication: initialData?.preferredCommunication || "",
    downPaymentMethod: initialData?.downPaymentMethod || "",
    financingOption: initialData?.financingOption || "",
    financingLoanId: initialData?.financingLoanId || "",
    financingPlan: initialData?.financingPlan || "",
    windowsBeingRemoved: initialData?.windowsBeingRemoved || "",
    paymentNotes: initialData?.paymentNotes || "",
    contractNotes: initialData?.contractNotes || "",
    customerNotes: initialData?.customerNotes || "",
    customerAcceptedTerms: initialData?.customerAcceptedTerms || false,
    brickApplicationQty: initialData?.brickApplicationQty || 0,
    stuccoApplicationQty: initialData?.stuccoApplicationQty || 0,
    sidingApplicationQty: initialData?.sidingApplicationQty || 0,
    foundationApplicationQty: initialData?.foundationApplicationQty || 0,
    woodApplicationQty: initialData?.woodApplicationQty || 0,
    measurementNotes: initialData?.measurementNotes || "",
    contractorSignature: initialData?.contractorSignature || "",
    contractorSignatureDate: initialData?.contractorSignatureDate || "",
    customerSignature: initialData?.customerSignature || "",
    customerSignatureDate: initialData?.customerSignatureDate || "",
    salesRepId: initialData?.salesRepId || "",
    setterId: initialData?.setterId || "",
    // Addendum fields
    installByAWD: initialData?.installByAWD || false,
    measurementsTakenBy: initialData?.measurementsTakenBy || "",
    hasShutters: initialData?.hasShutters || false,
    removalWindows: initialData?.removalWindows || 0,
    removalDoors: initialData?.removalDoors || 0,
    typeComingOut: initialData?.typeComingOut || "",
    windowsComingOutOf: initialData?.windowsComingOutOf || [],
    referredBy: initialData?.referredBy || "",
    referralName: initialData?.referralName || "",
    // New wizard fields
    quoteDate: initialData?.quoteDate || new Date().toISOString().split("T")[0],
    selfGeneratedLead: initialData?.selfGeneratedLead || false,
    territoryId: initialData?.territoryId || "",
  };
}

interface ChangeOrderData {
  id: string;
  changeOrderNumber: string;
  priceChangeType: string;
  priceChangeAmount: number;
  originalPrice: number;
  newPrice: number;
  newBalanceDue: number;
}

export interface ContractWizardProps {
  initialData?: Partial<SalesContractDraftValues> & { changeOrders?: ChangeOrderData[] };
  contractId?: string;
}

// Wizard steps configuration
const WIZARD_STEPS: WizardStep[] = [
  {
    id: "customer",
    label: "Customer",
    fields: ["customerName"],
  },
  {
    id: "windows",
    label: "Windows",
    fields: ["lineItems"],
  },
  {
    id: "options-pricing",
    label: "Options & Pricing",
    fields: ["discount"],
  },
  {
    id: "addendum",
    label: "Addendum",
    fields: [],
  },
  {
    id: "preview",
    label: "Preview",
    fields: [],
  },
  {
    id: "sign",
    label: "Sign",
    fields: [
      "contractorSignature",
      "customerSignature",
      "customerAcceptedTerms",
    ],
  },
];

export function ContractWizard({
  initialData,
  contractId: initialContractId,
}: ContractWizardProps) {
  const router = useRouter();
  const [contractId, setContractId] = useState<string | null>(
    initialContractId || null
  );
  const [submitting, setSubmitting] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [completedSteps, setCompletedSteps] = useState(new Set<number>([0]));
  const changeOrders = initialData?.changeOrders;

  // Territory state
  const [territories, setTerritories] = useState<TerritoryOption[]>([]);
  const [selectedTerritory, setSelectedTerritory] = useState<TerritoryOption | null>(null);

  const methods = useForm<SalesContractDraftValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Zod v4 + @hookform/resolvers type mismatch
    resolver: zodResolver(salesContractDraftSchema) as any,
    defaultValues: getDefaultValues(initialData),
  });

  const { trigger } = methods;

  // Fetch session to auto-fill salesman and territory
  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => (res.ok ? res.json() : null))
      .then((session) => {
        if (session?.user) {
          if (!methods.getValues("salesman") && session.user.name) {
            methods.setValue("salesman", session.user.name);
          }
          if (session.user.territoryId && session.user.territoryName) {
            const userTerritory = {
              id: session.user.territoryId,
              name: session.user.territoryName,
            };
            setSelectedTerritory(userTerritory);
            methods.setValue("territoryId", userTerritory.id, { shouldDirty: true });
          }
        }
      })
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch territories for header dropdown
  useEffect(() => {
    fetch("/api/users/territories")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        setTerritories(data);
        if (initialData?.territoryId) {
          const match = data.find((t: TerritoryOption) => t.id === initialData.territoryId);
          if (match) setSelectedTerritory(match);
        }
      })
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTerritoryChange = useCallback(
    (territory: TerritoryOption) => {
      setSelectedTerritory(territory);
      methods.setValue("territoryId", territory.id, { shouldDirty: true });
      setTerritories((prev) => {
        if (prev.some((t) => t.id === territory.id)) return prev;
        return [...prev, territory];
      });
    },
    [methods]
  );

  // Wrapper for trigger to match useWizard expected type
  const triggerWrapper = useCallback(async (fieldNames: string[]) => {
    const result = await trigger(fieldNames as unknown as Parameters<typeof trigger>[0]);
    return Boolean(result);
  }, [trigger]);

  // Wizard navigation
  const wizard = useWizard({
    steps: WIZARD_STEPS,
    trigger: triggerWrapper,
    initialStep: 0,
  });

  // Auto-save handler
  const handleAutoSave = useCallback(
    async (data: SalesContractDraftValues) => {
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
    watch: methods.watch as unknown as import("react-hook-form").UseFormWatch<
      Record<string, unknown>
    >,
    contractId,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onSave: handleAutoSave as any,
    enabled: !!contractId,
  });

  // Submit Contract
  async function onSubmit(data: SalesContractDraftValues) {
    if (!contractId) {
      const res = await fetch("/api/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "Failed to create contract");
        return;
      }
      const contract = await res.json();
      setContractId(contract.id);
    }

    if (!data.customerSignature) {
      toast.error("Customer signature is required");
      return;
    }

    if (!data.contractorSignature) {
      toast.error("Contractor signature is required");
      return;
    }

    if (!data.customerAcceptedTerms) {
      toast.error("You must accept the terms and conditions");
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
        setShowSuccessDialog(true);
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to submit contract");
      }
    } finally {
      setSubmitting(false);
    }
  }

  // Handle step navigation with completion tracking
  const handleNext = async () => {
    await wizard.next();
    setCompletedSteps((prev) => {
      const next = new Set(prev);
      for (let i = 0; i <= wizard.currentStepIndex + 1; i++) {
        next.add(i);
      }
      return next;
    });
  };

  const handleStepClick = async (index: number) => {
    await wizard.goToStep(index);
    setCompletedSteps((prev) => {
      const next = new Set(prev);
      for (let i = 0; i <= index; i++) {
        next.add(i);
      }
      return next;
    });
  };

  // Render active step
  const renderStep = () => {
    switch (wizard.currentStep.id) {
      case "customer":
        return <StepCustomer />;
      case "windows":
        return <StepWindows />;
      case "options-pricing":
        return <StepOptionsPricing />;
      case "addendum":
        return <StepAddendum />;
      case "preview":
        return <StepPreview />;
      case "sign":
        return (
          <StepSign
            submitting={submitting}
            onSubmit={() => methods.handleSubmit(onSubmit)()}
            contractId={contractId}
          />
        );
      default:
        return null;
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className="flex flex-col h-full -m-4 md:-m-6">
        {/* Header */}
        <WizardHeader
          saving={saving}
          lastSaved={lastSaved}
          territories={territories}
          selectedTerritory={selectedTerritory}
          onTerritoryChange={handleTerritoryChange}
        />

        {/* Change Order Banner */}
        {changeOrders && changeOrders.length > 0 && (
          <div className="flex items-center gap-3 border-b border-awp-orange/30 bg-awp-orange/10 px-4 py-3">
            <AlertTriangle className="h-5 w-5 text-awp-orange-text shrink-0" />
            <span className="text-sm font-medium">
              This contract has been modified by change orders.
            </span>
            <Badge variant="highlight">
              {changeOrders.length} Change Order{changeOrders.length > 1 ? "s" : ""}
            </Badge>
          </div>
        )}

        {/* Step Indicator */}
        <div className="border-b bg-gray-50 px-4 py-4">
          <WizardStepIndicator
            steps={WIZARD_STEPS}
            currentIndex={wizard.currentStepIndex}
            onStepClick={handleStepClick}
            completedSteps={completedSteps}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            <AnimatePresence mode="wait">
              {renderStep()}
            </AnimatePresence>
          </div>
        </div>

        {/* Navigation Footer */}
        <WizardNavButtons
          onPrevious={wizard.previous}
          onNext={wizard.isLastStep ? undefined : handleNext}
          canGoPrevious={wizard.canGoPrevious}
          isLastStep={wizard.isLastStep}
          submitting={submitting}
        />
      </form>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader className="items-center text-center">
            <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <DialogTitle className="text-xl">Contract Submitted</DialogTitle>
            <DialogDescription>
              Your contract has been submitted successfully. You can download the PDF now or return to your dashboard.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button
              size="lg"
              className="w-full"
              disabled={generatingPdf}
              onClick={async () => {
                if (!contractId) return;
                setGeneratingPdf(true);
                try {
                  const res = await fetch(`/api/contracts/${contractId}/pdf`);
                  if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    toast.error(err.error || "Failed to generate PDF");
                    return;
                  }
                  const { url } = await res.json();
                  window.open(url, "_blank");
                } catch {
                  toast.error("Failed to generate PDF");
                } finally {
                  setGeneratingPdf(false);
                }
              }}
            >
              {generatingPdf ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Generating PDF...
                </>
              ) : (
                <>
                  <Download className="h-5 w-5 mr-2" />
                  Download PDF
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="w-full"
              onClick={() => router.push("/")}
            >
              Back to Dashboard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </FormProvider>
  );
}
