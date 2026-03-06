"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight, DollarSign, Loader2 } from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  SALES_REP: "Sales Rep",
  SETTER: "Setter",
  SETTER_MANAGER: "Setter Mgr",
  TERRITORY_OWNER: "Territory",
  VP: "VP",
  NSM: "NSM",
};

interface PreviewEntry {
  userId: string;
  userName: string;
  commissionType: string;
  rate: number;
  amount: number;
  isBelowFair: boolean;
  isSelfGen: boolean;
  tierLabel?: string;
  notes?: string;
}

export function CommissionPreview() {
  const { data: session } = useSession();
  const { control } = useFormContext();
  const [entries, setEntries] = useState<PreviewEntry[]>([]);
  const [totalCommission, setTotalCommission] = useState(0);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  const salesRepId = useWatch({ control, name: "salesRepId" });
  const setterId = useWatch({ control, name: "setterId" });
  const discount = useWatch({ control, name: "discount" });
  const lineItems = useWatch({ control, name: "lineItems" });

  // Calculate totals from line items
  const total = (lineItems ?? []).reduce(
    (sum: number, item: { price?: number }) => sum + (item?.price ?? 0),
    0
  );
  const contractTotal = Math.max(0, total - (discount ?? 0));

  const fetchPreview = useCallback(async () => {
    if (!salesRepId || contractTotal <= 0) {
      setEntries([]);
      setTotalCommission(0);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/commissions/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractTotal,
          fairPrice: total,
          salesRepId,
          setterId: setterId || null,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries ?? []);
        setTotalCommission(data.totalCommission ?? 0);
      }
    } finally {
      setLoading(false);
    }
  }, [salesRepId, setterId, contractTotal, total]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(fetchPreview, 500);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [fetchPreview]);

  // Only show for admin users
  if (session?.user?.role !== "ADMIN") return null;
  if (contractTotal <= 0 && entries.length === 0) return null;

  return (
    <Card>
      <CardHeader
        className="cursor-pointer select-none pb-3"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {expanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Commission Preview</CardTitle>
            {loading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
          </div>
          <span className="text-lg font-bold">
            ${totalCommission.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </span>
        </div>
      </CardHeader>
      {expanded && (
        <CardContent className="pt-0">
          {entries.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {contractTotal <= 0
                ? "Add line items and select a sales rep to preview commissions."
                : "No commission entries for current configuration."}
            </p>
          ) : (
            <div className="space-y-2">
              {entries.map((entry, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-sm border-b last:border-0 pb-2 last:pb-0"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {ROLE_LABELS[entry.commissionType] ?? entry.commissionType}
                    </span>
                    <span className="text-muted-foreground">{entry.userName}</span>
                    {entry.isBelowFair && (
                      <Badge variant="outline" className="text-xs">Below Fair</Badge>
                    )}
                    {entry.isSelfGen && (
                      <Badge variant="outline" className="text-xs">Self-Gen</Badge>
                    )}
                    {entry.tierLabel && (
                      <Badge variant="secondary" className="text-xs">{entry.tierLabel}</Badge>
                    )}
                    {entry.notes && (
                      <Badge variant="secondary" className="text-xs">{entry.notes}</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground">
                      {(entry.rate * 100).toFixed(2)}%
                    </span>
                    <span className="font-medium">
                      ${entry.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
