"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AutoSaveIndicator } from "@/components/shared/auto-save-indicator";

export interface WizardHeaderProps {
  saving?: boolean;
  lastSaved?: Date | null;
  hasUnsavedRecovery?: boolean;
  onDismissRecovery?: () => void;
  className?: string;
}

export function WizardHeader({
  saving = false,
  lastSaved = null,
  hasUnsavedRecovery = false,
  onDismissRecovery,
  className,
}: WizardHeaderProps) {
  return (
    <header className={cn("border-b bg-white", className)}>
      {/* Recovery banner */}
      {hasUnsavedRecovery && (
        <div className="bg-amber-50 px-4 py-2 text-sm text-amber-800 border-b border-amber-200 flex items-center justify-between">
          <span>
            We found unsaved changes from a previous session.{" "}
            <button
              type="button"
              onClick={onDismissRecovery}
              className="underline font-medium hover:text-amber-900"
            >
              Restore
            </button>
          </span>
          {onDismissRecovery && (
            <button
              type="button"
              onClick={onDismissRecovery}
              className="text-amber-600 hover:text-amber-800"
              aria-label="Dismiss recovery banner"
            >
              Dismiss
            </button>
          )}
        </div>
      )}

      <div className="flex items-center justify-between px-4 py-3">
        {/* Title and territory selector */}
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold text-gray-900">
            New Contract / Build a window replacement quote
          </h1>

          {/* Territory selector placeholder */}
          <div className="h-6 w-px bg-gray-300" />
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Territory:</span>
            <select
              className="text-sm border-gray-300 rounded-md shadow-sm focus:border-awp-blue focus:ring-awp-blue"
              defaultValue=""
            >
              <option value="" disabled>
                Select territory...
              </option>
              {/* Territories will be populated dynamically */}
            </select>
          </div>
        </div>

        {/* Right side: auto-save indicator and exit button */}
        <div className="flex items-center gap-4">
          <AutoSaveIndicator saving={saving} lastSaved={lastSaved} />

          <Link href="/">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-500 hover:text-gray-700"
              aria-label="Exit wizard"
            >
              <X className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
