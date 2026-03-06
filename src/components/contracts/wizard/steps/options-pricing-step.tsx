"use client";

import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PricingSummary } from "@/components/contracts/pricing-summary";
import { CommissionPreview } from "@/components/contracts/commission-preview";
import { FORM_OPTIONS } from "@/lib/constants";

export function OptionsPricingStep() {
  const { register } = useFormContext();

  return (
    <div className="space-y-6">
      {/* Job Details Section */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Job Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="measuredBy">Measured By</Label>
            <Input id="measuredBy" {...register("measuredBy")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="yearBuilt">Year Built</Label>
            <Input id="yearBuilt" {...register("yearBuilt")} />
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <Label>House Type</Label>
          <div className="flex flex-wrap gap-4">
            {FORM_OPTIONS.houseType.map((type) => (
              <label key={type} className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  value={type}
                  {...register("houseType")}
                  className="accent-primary"
                />
                {type}
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Pricing Summary */}
      <PricingSummary />

      {/* Commission Preview */}
      <CommissionPreview />
    </div>
  );
}
