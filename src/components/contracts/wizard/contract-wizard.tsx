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
import { CustomerStep } from "./steps/customer-step";
import { WindowsStep } from "./steps/windows-step";
import { OptionsPricingStep } from "./steps/options-pricing-step";
import { AddendumStep } from "./steps/addendum-step";
import { PreviewStep } from "./steps/preview-step";
import { SignStep } from "./steps/sign-step";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";

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

function getDefaultValues(
  initialData?: Partial<SalesContractDraftValues>
): SalesContractDraftValues {
  return {
    customerName: initialData?.customerName || "",
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
  const [completedSteps, setCompletedSteps] = useState(new Set<number>([0]));
  const changeOrders = initialData?.changeOrders;
  // Salespeople fetched in step components, not used here
  const [_salespeople, _setSalespeople] = useState<
    Array<{ id: string; name: string | null; email: string }>
  >([]);

  const methods = useForm<SalesContractDraftValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Zod v4 + @hookform/resolvers type mismatch
    resolver: zodResolver(salesContractDraftSchema) as any,
    defaultValues: getDefaultValues(initialData),
  });

  const { trigger } = methods;

  // Wrapper for trigger to match useWizard expected type
  const triggerWrapper = useCallback(async (fieldNames: string[]) => {
    // trigger returns boolean | Promise<boolean>, handle both
    const result = await trigger(fieldNames as unknown as Parameters<typeof trigger>[0]);
    return Boolean(result);
  }, [trigger]);

  // Wizard navigation
  const wizard = useWizard({
    steps: WIZARD_STEPS,
    trigger: triggerWrapper,
    initialStep: 0,
  });

  // Fetch salespeople for dropdowns
  useEffect(() => {
    fetch("/api/users/salespeople")
      .then((res) => (res.ok ? res.json() : []))
      .then(_setSalespeople)
      .catch(() => {});
  }, []);

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

  // Save Draft (exposed but not currently used in wizard UI)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async function onSaveDraft() {
    const data = methods.getValues();
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

  // Submit Contract
  async function onSubmit(data: SalesContractDraftValues) {
    if (!contractId) {
      // Create contract first if it doesn't exist
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

  // Handle step navigation with completion tracking
  const handleNext = async () => {
    await wizard.next();
    // Mark all steps up to current as completed
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
    // Update completion on direct navigation
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
        return <CustomerStep />;
      case "windows":
        return <WindowsStep />;
      case "options-pricing":
        return <OptionsPricingStep />;
      case "addendum":
        return <AddendumStep />;
      case "preview":
        return <PreviewStep />;
      case "sign":
        return <SignStep />;
      default:
        return null;
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className="flex flex-col h-screen">
        {/* Header */}
        <WizardHeader saving={saving} lastSaved={lastSaved} />

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
    </FormProvider>
  );
}
