"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Plus } from "lucide-react";

export interface TierRow {
  minAmount: number;
  maxAmount: number | null;
  rate: number;
  sortOrder: number;
}

interface TierEditorProps {
  tiers: TierRow[];
  onChange: (tiers: TierRow[]) => void;
}

export function TierEditor({ tiers, onChange }: TierEditorProps) {
  function addTier() {
    const last = tiers[tiers.length - 1];
    const newMin = last ? (last.maxAmount ?? last.minAmount + 10000) : 0;
    onChange([
      ...tiers,
      {
        minAmount: newMin,
        maxAmount: null,
        rate: 0.1,
        sortOrder: tiers.length,
      },
    ]);
  }

  function removeTier(index: number) {
    const updated = tiers.filter((_, i) => i !== index).map((t, i) => ({
      ...t,
      sortOrder: i,
    }));
    onChange(updated);
  }

  function updateTier(index: number, field: keyof TierRow, value: string) {
    const updated = [...tiers];
    if (field === "maxAmount") {
      updated[index] = {
        ...updated[index],
        maxAmount: value === "" ? null : parseFloat(value),
      };
    } else if (field === "rate") {
      updated[index] = {
        ...updated[index],
        rate: parseFloat(value) / 100 || 0,
      };
    } else {
      updated[index] = {
        ...updated[index],
        [field]: parseFloat(value) || 0,
      };
    }
    onChange(updated);
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 text-sm font-medium text-muted-foreground">
        <span>Min Amount ($)</span>
        <span>Max Amount ($)</span>
        <span>Rate (%)</span>
        <span className="w-9" />
      </div>
      {tiers.map((tier, i) => (
        <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-center">
          <Input
            type="number"
            min={0}
            value={tier.minAmount}
            onChange={(e) => updateTier(i, "minAmount", e.target.value)}
          />
          <Input
            type="number"
            min={0}
            placeholder="Unlimited"
            value={tier.maxAmount ?? ""}
            onChange={(e) => updateTier(i, "maxAmount", e.target.value)}
          />
          <Input
            type="number"
            min={0}
            max={100}
            step={0.5}
            value={Math.round(tier.rate * 10000) / 100}
            onChange={(e) => updateTier(i, "rate", e.target.value)}
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => removeTier(i)}
            aria-label="Remove tier"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addTier}>
        <Plus className="h-4 w-4 mr-1" />
        Add Tier
      </Button>
      <p className="text-xs text-muted-foreground">
        Graduated brackets: each bracket is taxed at its own rate (like income tax).
        Leave max amount empty for the highest unlimited bracket.
      </p>
    </div>
  );
}
