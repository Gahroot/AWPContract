"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import * as motion from "motion/react-client";
import type { WizardStep } from "./use-wizard";

export interface WizardStepIndicatorProps {
  steps: WizardStep[];
  currentIndex: number;
  onStepClick: (index: number) => void;
  completedSteps: Set<number>;
}

const stepNumbers = [
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
];

const stepLabels = [
  "Customer",
  "Windows",
  "Options & Pricing",
  "Addendum",
  "Preview",
  "Sign",
];

export function WizardStepIndicator({
  steps,
  currentIndex,
  onStepClick,
  completedSteps,
}: WizardStepIndicatorProps) {
  return (
    <nav aria-label="Wizard progress" className="w-full">
      <ol className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isActive = index === currentIndex;
          const isCompleted = completedSteps.has(index);
          const isClickable = index < currentIndex;

          return (
            <li key={step.id} className="flex items-center flex-1">
              <button
                type="button"
                onClick={() => isClickable && onStepClick(index)}
                disabled={!isClickable && !isActive}
                className={cn(
                  "group relative flex flex-col items-center gap-1 focus:outline-none",
                  !isClickable && !isActive && "pointer-events-none"
                )}
                aria-current={isActive ? "step" : undefined}
              >
                {/* Step circle */}
                <motion.div
                  initial={false}
                  animate={{
                    scale: isActive ? 1.1 : 1,
                    backgroundColor: isActive
                      ? "rgb(30, 64, 175)"
                      : isCompleted
                        ? "transparent"
                        : "rgb(243, 244, 246)",
                    borderColor: isCompleted
                      ? "rgb(30, 64, 175)"
                      : "rgb(229, 231, 235)",
                  }}
                  transition={{ duration: 0.2 }}
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors",
                    isActive
                      ? "bg-awp-blue border-awp-blue text-white"
                      : isCompleted
                        ? "border-awp-blue text-awp-blue bg-transparent"
                        : "border-gray-300 bg-gray-100 text-gray-500"
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" strokeWidth={3} />
                  ) : (
                    stepNumbers[index]
                  )}
                </motion.div>

                {/* Step label */}
                <span
                  className={cn(
                    "whitespace-nowrap text-xs font-medium",
                    isActive
                      ? "text-awp-blue"
                      : isCompleted
                        ? "text-gray-600"
                        : "text-gray-400"
                  )}
                >
                  {stepLabels[index]}
                </span>
              </button>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "flex h-0.5 w-full min-w-8 flex-1 items-center",
                    isCompleted ? "bg-awp-blue" : "bg-gray-200"
                  )}
                  aria-hidden="true"
                >
                  {(isCompleted || isActive) && index < currentIndex && (
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="h-full bg-awp-blue"
                    />
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
