import { useCallback, useState } from "react";

export interface WizardStep {
  id: string;
  label: string;
  fields: string[];
}

export interface UseWizardOptions {
  steps: WizardStep[];
  trigger: (fieldNames: string[]) => Promise<boolean>;
  initialStep?: number;
}

export interface UseWizardReturn {
  currentStep: WizardStep;
  currentStepIndex: number;
  next: () => Promise<void>;
  previous: () => void;
  goToStep: (index: number) => Promise<void>;
  canGoNext: boolean;
  canGoPrevious: boolean;
  isLastStep: boolean;
  isFirstStep: boolean;
}

export function useWizard({
  steps,
  trigger,
  initialStep = 0,
}: UseWizardOptions): UseWizardReturn {
  const [currentStepIndex, setCurrentStepIndex] = useState(initialStep);

  const currentStep = steps[currentStepIndex];

  const next = useCallback(async () => {
    if (currentStepIndex >= steps.length - 1) return;

    const nextStep = steps[currentStepIndex + 1];
    const isValid = await trigger(nextStep.fields);

    if (isValid) {
      setCurrentStepIndex((prev) => prev + 1);
    }
  }, [currentStepIndex, steps, trigger]);

  const previous = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  }, [currentStepIndex]);

  const goToStep = useCallback(
    async (index: number) => {
      if (index < 0 || index >= steps.length) return;

      // Allow backward navigation without validation
      if (index < currentStepIndex) {
        setCurrentStepIndex(index);
        return;
      }

      // Forward navigation requires validation
      const targetStep = steps[index];
      const isValid = await trigger(targetStep.fields);

      if (isValid) {
        setCurrentStepIndex(index);
      }
    },
    [currentStepIndex, steps, trigger]
  );

  return {
    currentStep,
    currentStepIndex,
    next,
    previous,
    goToStep,
    canGoNext: currentStepIndex < steps.length - 1,
    canGoPrevious: currentStepIndex > 0,
    isLastStep: currentStepIndex === steps.length - 1,
    isFirstStep: currentStepIndex === 0,
  };
}
