import { CheckCircle2, AlertCircle, Loader2, Cloud } from "lucide-react";
import { cn } from "@/lib/utils";

interface HubSpotSyncBadgeProps {
  status: string | null;
  lastSynced: string | null;
  error: string | null;
  className?: string;
}

export function HubSpotSyncBadge({ status, lastSynced, error, className }: HubSpotSyncBadgeProps) {
  if (!status) {
    return (
      <span className={cn("text-muted-foreground text-xs flex items-center gap-1", className)}>
        <Cloud className="h-3 w-3" />
        Not synced
      </span>
    );
  }

  switch (status) {
    case "synced":
      return (
        <span className={cn("text-green-600 text-xs flex items-center gap-1", className)} title={`Last synced: ${lastSynced}`}>
          <CheckCircle2 className="h-3 w-3" />
          Synced
        </span>
      );
    case "syncing":
      return (
        <span className={cn("text-blue-600 text-xs flex items-center gap-1", className)}>
          <Loader2 className="h-3 w-3 animate-spin" />
          Syncing...
        </span>
      );
    case "failed":
      return (
        <span className={cn("text-red-600 text-xs flex items-center gap-1", className)} title={error || "Sync failed"}>
          <AlertCircle className="h-3 w-3" />
          Failed
        </span>
      );
    default:
      return null;
  }
}
