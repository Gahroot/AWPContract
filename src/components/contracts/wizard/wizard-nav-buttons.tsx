"use client";

import { ChevronLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import * as motion from "motion/react-client";

export interface WizardNavButtonsProps {
  onPrevious?: () => void;
  onNext?: () => void;
  canGoPrevious: boolean;
  isLastStep: boolean;
  submitting?: boolean;
  previousLabel?: string;
  nextLabel?: string;
  submitLabel?: string;
  className?: string;
}

export function WizardNavButtons({
  onPrevious,
  onNext,
  canGoPrevious,
  isLastStep,
  submitting = false,
  previousLabel = "Previous",
  nextLabel = "Next",
  submitLabel = "Submit Contract",
  className,
}: WizardNavButtonsProps) {
  return (
    <motion.footer
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "flex items-center justify-between border-t bg-white px-4 py-3",
        className
      )}
    >
      {/* Previous button */}
      <Button
        type="button"
        variant="outline"
        onClick={onPrevious}
        disabled={!canGoPrevious}
        className="gap-1"
      >
        <ChevronLeft className="h-4 w-4" />
        {previousLabel}
      </Button>

      {/* Next/Submit button */}
      <Button
        type={isLastStep ? "submit" : "button"}
        onClick={isLastStep ? undefined : onNext}
        disabled={submitting}
        className="gap-1 bg-awp-blue hover:bg-awp-blue/90"
      >
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Submitting...
          </>
        ) : isLastStep ? (
          submitLabel
        ) : (
          <>
            {nextLabel}
            <ChevronLeft className="h-4 w-4 rotate-180" />
          </>
        )}
      </Button>
    </motion.footer>
  );
}
