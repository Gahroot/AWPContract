"use client";

import { useFormContext } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { FORM_OPTIONS } from "@/lib/constants";

interface LineItem {
  qty: number;
  function?: string;
  type?: string;
}

export function StepAddendum() {
  const { watch, setValue, register } = useFormContext();

  const lineItems = (watch("lineItems") || []) as LineItem[];

  // Calculate total quantity and summary
  const totalQty = lineItems.reduce((sum, item) => sum + (item.qty || 0), 0);
  const productSummary = lineItems
    .filter((item) => item.qty > 0)
    .map((item) => `${item.qty || 0} ${item.function || item.type || "Item"}`)
    .join(", ");

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Addendum Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Customer Name Display */}
          <div className="space-y-2">
            <Label>Customer Name</Label>
            <p className="text-sm text-muted-foreground">{watch("customerName") || "Not specified"}</p>
          </div>

          {/* Quantity & Product Summary */}
          <div className="space-y-2">
            <Label>Products</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-md">
              <div>
                <p className="text-xs text-muted-foreground">Total Quantity</p>
                <p className="text-lg font-semibold">{totalQty}</p>
              </div>
              <div className="col-span-3">
                <p className="text-xs text-muted-foreground">Summary</p>
                <p className="text-sm">{productSummary || "No products added"}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Color Selection */}
          <div className="space-y-3">
            <Label htmlFor="addendumColor">Color</Label>
            <select
              id="addendumColor"
              {...register("addendumColor")}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">Select color</option>
              {FORM_OPTIONS.color.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <Separator />

          {/* Installation Section */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold">Installation</h3>

            {/* AWD Checkbox */}
            <div className="flex items-center gap-3">
              <Checkbox
                id="installByAWD"
                checked={watch("installByAWD") || false}
                onCheckedChange={(checked) =>
                  setValue("installByAWD", checked, { shouldDirty: true })
                }
              />
              <Label htmlFor="installByAWD" className="cursor-pointer">
                Install by AWD
              </Label>
            </div>

            {/* Measurements Radio Buttons */}
            <div className="space-y-2">
              <Label>Measurements Taken By</Label>
              <RadioGroup
                value={watch("measurementsTakenBy") || ""}
                onValueChange={(value) =>
                  setValue("measurementsTakenBy", value, { shouldDirty: true })
                }
              >
                <div className="flex flex-wrap gap-4">
                  {["AWD", "Customer", "Other"].map((option) => (
                    <label key={option} className="flex items-center gap-2 text-sm cursor-pointer">
                      <RadioGroupItem value={option} />
                      {option}
                    </label>
                  ))}
                </div>
              </RadioGroup>
            </div>
          </div>

          <Separator />

          {/* Remove & Replace Section */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold">Remove & Replace</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { key: "installRemoveOld", label: "Remove Old" },
                { key: "installHaulAway", label: "Haul Away" },
                { key: "installInteriorTrim", label: "Interior Trim" },
                { key: "installExteriorTrim", label: "Exterior Trim" },
                { key: "installCaulkSeal", label: "Caulk & Seal" },
                { key: "installScreens", label: "Install Screens" },
                { key: "installHardware", label: "Install Hardware" },
                { key: "installWeatherstrip", label: "Weatherstrip" },
                { key: "installCleanup", label: "Cleanup" },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center gap-3">
                  <Checkbox
                    id={key}
                    checked={watch(key) || false}
                    onCheckedChange={(checked) =>
                      setValue(key, checked, { shouldDirty: true })
                    }
                  />
                  <Label htmlFor={key} className="cursor-pointer text-sm">
                    {label}
                  </Label>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <Checkbox
                id="installOther"
                checked={watch("installOther") || false}
                onCheckedChange={(checked) =>
                  setValue("installOther", checked, { shouldDirty: true })
                }
              />
              <Label htmlFor="installOther" className="cursor-pointer">
                Other Installation
              </Label>
            </div>
          </div>

          <Separator />

          {/* Shutters Section */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold">Shutters</h3>
            <div className="flex items-center gap-3">
              <Checkbox
                id="hasShutters"
                checked={watch("hasShutters") || false}
                onCheckedChange={(checked) =>
                  setValue("hasShutters", checked, { shouldDirty: true })
                }
              />
              <Label htmlFor="hasShutters" className="cursor-pointer">
                Has Interior Shutters
              </Label>
            </div>
          </div>

          <Separator />

          {/* Windows Coming Out Of Section */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold">Windows Coming Out Of</h3>
            <div className="flex flex-wrap gap-4">
              {["Aluminum", "Wood", "Vinyl"].map((material) => (
                <label key={material} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={watch("windowsComingOutOf")?.includes(material) || false}
                    onCheckedChange={(checked) => {
                      const current = (watch("windowsComingOutOf") || []) as string[];
                      const updated = checked
                        ? [...current, material]
                        : current.filter((m) => m !== material);
                      setValue("windowsComingOutOf", updated, { shouldDirty: true });
                    }}
                  />
                  {material}
                </label>
              ))}
            </div>
          </div>

          <Separator />

          {/* Acknowledgements Section */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold">Acknowledgements</h3>
            <div className="space-y-3">
              {[
                { key: "ackMeasurements", label: "I verify that measurements are accurate" },
                { key: "ackSpecifications", label: "I verify product specifications are correct" },
                { key: "ackPricing", label: "I understand the pricing and payment terms" },
                { key: "ackTerms", label: "I agree to the terms and conditions" },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-start gap-3">
                  <Checkbox
                    id={key}
                    checked={watch(key) || false}
                    onCheckedChange={(checked) =>
                      setValue(key, checked, { shouldDirty: true })
                    }
                  />
                  <Label htmlFor={key} className="cursor-pointer text-sm leading-tight pt-0.5">
                    {label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Notes Section */}
          <div className="space-y-2">
            <Label htmlFor="addendumNotes">Notes</Label>
            <Textarea
              id="addendumNotes"
              placeholder="Enter any additional notes..."
              rows={4}
              {...register("addendumNotes")}
            />
          </div>

          <Separator />

          {/* Referral Section */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold">Referral Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="referredBy">Referred By</Label>
                <select
                  id="referredBy"
                  {...register("referredBy")}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">Select referral source</option>
                  {FORM_OPTIONS.marketingSource.map((source) => (
                    <option key={source} value={source}>
                      {source}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="referralName">Referral Name</Label>
                <input
                  id="referralName"
                  type="text"
                  placeholder="Name of person who referred"
                  {...register("referralName")}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
