export {
  useWizard,
  type WizardStep,
  type UseWizardOptions,
  type UseWizardReturn,
} from "./use-wizard";

export {
  WizardStepIndicator,
  type WizardStepIndicatorProps,
} from "./wizard-step-indicator";

export { WizardHeader, type WizardHeaderProps } from "./wizard-header";

export {
  WizardNavButtons,
  type WizardNavButtonsProps,
} from "./wizard-nav-buttons";

// Step components (new step-*.tsx)
export { StepCustomer } from "./steps/step-customer";
export { StepWindows } from "./steps/step-windows";
export { StepOptionsPricing } from "./steps/step-options-pricing";
export { StepAddendum } from "./steps/step-addendum";
export { StepPreview } from "./steps/step-preview";
export { StepSign } from "./steps/step-sign";

// Main wizard
export { ContractWizard, type ContractWizardProps } from "./contract-wizard";
