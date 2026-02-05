"use client";

import { forwardRef } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface CurrencyInputProps
  extends Omit<React.ComponentProps<"input">, "type" | "onChange"> {
  onChange?: (value: number) => void;
}

export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ className, onChange, value, ...props }, ref) => {
    return (
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
          $
        </span>
        <Input
          ref={ref}
          type="number"
          step="0.01"
          min="0"
          className={cn("pl-7", className)}
          value={value}
          onChange={(e) => {
            const num = parseFloat(e.target.value) || 0;
            onChange?.(num);
          }}
          {...props}
        />
      </div>
    );
  }
);
CurrencyInput.displayName = "CurrencyInput";
