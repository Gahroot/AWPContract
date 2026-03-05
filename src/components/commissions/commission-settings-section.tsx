"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChevronDown, ChevronRight } from "lucide-react";

interface RateField {
  key: string;
  label: string;
  type: "percent" | "dollar" | "multiplier";
  step?: number;
}

interface CommissionSettingsSectionProps {
  title: string;
  description: string;
  fields: RateField[];
  values: Record<string, number>;
  onChange: (key: string, value: number) => void;
  defaultOpen?: boolean;
}

export function CommissionSettingsSection({
  title,
  description,
  fields,
  values,
  onChange,
  defaultOpen = false,
}: CommissionSettingsSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Card>
      <CardHeader
        className="cursor-pointer select-none"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-2">
          {open ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription className="mt-1">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      {open && (
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            {fields.map((field) => {
              const raw = values[field.key] ?? 0;
              const displayValue =
                field.type === "percent"
                  ? Math.round(raw * 10000) / 100
                  : field.type === "multiplier"
                    ? Math.round(raw * 100)
                    : raw;

              return (
                <div key={field.key} className="space-y-1">
                  <Label className="text-sm">{field.label}</Label>
                  <div className="flex items-center gap-2">
                    {field.type === "dollar" && (
                      <span className="text-sm text-muted-foreground">$</span>
                    )}
                    <Input
                      type="number"
                      min={0}
                      max={field.type === "percent" ? 100 : undefined}
                      step={field.step ?? (field.type === "percent" ? 0.5 : 1)}
                      value={displayValue}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value) || 0;
                        const stored =
                          field.type === "percent"
                            ? v / 100
                            : field.type === "multiplier"
                              ? v / 100
                              : v;
                        onChange(field.key, stored);
                      }}
                      className="max-w-[160px]"
                    />
                    {field.type === "percent" && (
                      <span className="text-sm text-muted-foreground">%</span>
                    )}
                    {field.type === "multiplier" && (
                      <span className="text-sm text-muted-foreground">%</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
