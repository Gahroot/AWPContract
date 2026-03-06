"use client";

import { X, MapPin } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { AutoSaveIndicator } from "@/components/shared/auto-save-indicator";
import {
  TerritoryCombobox,
  type TerritoryOption,
} from "@/components/shared/territory-combobox";

export interface WizardHeaderProps {
  saving?: boolean;
  lastSaved?: Date | null;
  hasUnsavedRecovery?: boolean;
  onDismissRecovery?: () => void;
  territories?: TerritoryOption[];
  selectedTerritory?: TerritoryOption | null;
  onTerritoryChange?: (territory: TerritoryOption) => void;
  className?: string;
}

export function WizardHeader({
  saving = false,
  lastSaved = null,
  hasUnsavedRecovery = false,
  onDismissRecovery,
  territories = [],
  selectedTerritory = null,
  onTerritoryChange,
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
          <div>
            <h1 className="text-lg font-bold text-gray-900">New Contract</h1>
            <p className="text-sm text-gray-500">Build a window replacement quote</p>
          </div>

          <div className="h-6 w-px bg-gray-300" />
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-gray-400" />
            {onTerritoryChange ? (
              <TerritoryCombobox
                value={selectedTerritory ?? null}
                options={territories}
                onChange={onTerritoryChange}
                placeholder="Select territory..."
              />
            ) : (
              <span className="text-sm text-gray-400">No territories</span>
            )}
          </div>
        </div>

        {/* Right side: auto-save indicator and exit button */}
        <div className="flex items-center gap-4">
          <AutoSaveIndicator saving={saving} lastSaved={lastSaved} />

          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="h-4 w-4" />
            Exit
          </Link>
        </div>
      </div>
    </header>
  );
}
