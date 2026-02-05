"use client";

import { Cloud, CloudOff, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface AutoSaveIndicatorProps {
  saving: boolean;
  lastSaved: Date | null;
}

export function AutoSaveIndicator({
  saving,
  lastSaved,
}: AutoSaveIndicatorProps) {
  if (saving) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>Saving...</span>
      </div>
    );
  }

  if (lastSaved) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Cloud className="h-3 w-3" />
        <span>
          Saved {formatDistanceToNow(lastSaved, { addSuffix: true })}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <CloudOff className="h-3 w-3" />
      <span>Not saved</span>
    </div>
  );
}
