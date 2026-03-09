"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WizardStep } from "./use-wizard";

export interface WizardStepIndicatorProps {
  steps: WizardStep[];
  currentIndex: number;
  onStepClick: (index: number) => void;
  completedSteps: Set<number>;
}

export function WizardStepIndicator({
  steps,
  currentIndex,
  onStepClick,
  completedSteps,
}: WizardStepIndicatorProps) {
  return (
    <nav aria-label="Wizard progress" className="w-full">
      <ol className="flex items-center justify-center gap-1 sm:gap-2">
        {steps.map((step, index) => {
          const isActive = index === currentIndex;
          const isCompleted = completedSteps.has(index) && !isActive;
          const isClickable = index < currentIndex;

          return (
            <li key={step.id}>
              <button
                type="button"
                onClick={() => isClickable && onStepClick(index)}
                disabled={!isClickable && !isActive}
                className={cn(
                  "rounded-full px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium border-2 flex items-center gap-1.5 transition-colors",
                  isActive
                    ? "bg-blue-600 border-blue-600 text-white"
                    : isCompleted
                      ? "border-blue-600 text-blue-600 bg-transparent"
                      : "border-gray-300 text-gray-400 bg-transparent",
                  isClickable && "cursor-pointer hover:border-blue-400",
                  !isClickable && !isActive && "pointer-events-none"
                )}
                aria-current={isActive ? "step" : undefined}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4" strokeWidth={3} />
                ) : (
                  <span>{index + 1}</span>
                )}
                <span className="hidden sm:inline">{step.label}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
