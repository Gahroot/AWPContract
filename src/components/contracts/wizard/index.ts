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

// Step components
export { CustomerStep } from "./steps/customer-step";
export { WindowsStep } from "./steps/windows-step";
export { OptionsPricingStep } from "./steps/options-pricing-step";
export { AddendumStep } from "./steps/addendum-step";
export { PreviewStep } from "./steps/preview-step";
export { SignStep } from "./steps/sign-step";

// Main wizard
export { ContractWizard, type ContractWizardProps } from "./contract-wizard";
