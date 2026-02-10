"use client";

import { Input } from "@/components/ui/input";

export interface SalespersonRate {
  userId: string;
  name: string;
  email: string;
  rate: number;
}

interface SalespersonRateEditorProps {
  rates: SalespersonRate[];
  onChange: (rates: SalespersonRate[]) => void;
}

export function SalespersonRateEditor({
  rates,
  onChange,
}: SalespersonRateEditorProps) {
  function updateRate(index: number, value: string) {
    const updated = [...rates];
    updated[index] = {
      ...updated[index],
      rate: (parseFloat(value) || 0) / 100,
    };
    onChange(updated);
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-[1fr_1fr] gap-2 text-sm font-medium text-muted-foreground">
        <span>Salesperson</span>
        <span>Rate (%)</span>
      </div>
      {rates.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No salespeople found. Add users with the SALESMAN role first.
        </p>
      )}
      {rates.map((r, i) => (
        <div key={r.userId} className="grid grid-cols-[1fr_1fr] gap-2 items-center">
          <span className="text-sm">{r.name || r.email}</span>
          <Input
            type="number"
            min={0}
            max={100}
            step={0.5}
            value={Math.round(r.rate * 10000) / 100}
            onChange={(e) => updateRate(i, e.target.value)}
          />
        </div>
      ))}
    </div>
  );
}
