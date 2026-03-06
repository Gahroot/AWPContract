"use client";

import { useFormContext } from "react-hook-form";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { FORM_OPTIONS } from "@/lib/constants";

export function StepCustomer() {
  const { register, setValue, watch } = useFormContext();

  // Fetch salespeople for dropdowns
  const [salespeople, setSalespeople] = useState<
    { id: string; name: string | null; email: string }[]
  >([]);
  useEffect(() => {
    fetch("/api/users/salespeople")
      .then((res) => (res.ok ? res.json() : []))
      .then(setSalespeople)
      .catch(() => {});
  }, []);

  // Split customer name on space for display
  const customerName = watch("customerName") || "";
  const parts = customerName.split(" ");
  const [firstName, lastName] = parts.reduce(
    (acc: [string, string], part: string, i: number, arr: string[]) => {
      if (i === 0) return [part, ""];
      if (i === arr.length - 1) return [acc[0], part];
      return [acc[0], acc[1] + " " + part];
    },
    ["", ""]
  );

  const handleFirstNameBlur = () => {
    const first = watch("customerFirstName") || "";
    const last = watch("customerLastName") || "";
    if (first || last) {
      setValue("customerName", `${first} ${last}`.trim(), { shouldDirty: true });
    }
  };

  const handleLastNameBlur = () => {
    const first = watch("customerFirstName") || "";
    const last = watch("customerLastName") || "";
    if (first || last) {
      setValue("customerName", `${first} ${last}`.trim(), { shouldDirty: true });
    }
  };

  return (
    <div className="space-y-6">
      {/* Customer Info Section */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customerFirstName">
                First Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="customerFirstName"
                defaultValue={firstName}
                {...register("customerFirstName", { onBlur: handleFirstNameBlur })}
                placeholder="John"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerLastName">
                Last Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="customerLastName"
                defaultValue={lastName}
                {...register("customerLastName", { onBlur: handleLastNameBlur })}
                placeholder="Doe"
              />
              <input type="hidden" {...register("customerName")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerPhone">Phone</Label>
              <Input
                id="customerPhone"
                {...register("customerPhone")}
                placeholder="(801) 555-0000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerPhoneAlt">Alt Phone</Label>
              <Input id="customerPhoneAlt" {...register("customerPhoneAlt")} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="customerEmail">Email</Label>
              <Input
                id="customerEmail"
                type="email"
                {...register("customerEmail")}
                placeholder="customer@email.com"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Preferred Communication</Label>
              <RadioGroup
                value={watch("preferredCommunication") || ""}
                onValueChange={(v) =>
                  setValue("preferredCommunication", v, { shouldDirty: true })
                }
              >
                <div className="flex gap-4">
                  {FORM_OPTIONS.preferredCommunication.map((method) => (
                    <label key={method} className="flex items-center gap-2 text-sm">
                      <RadioGroupItem value={method} />
                      {method}
                    </label>
                  ))}
                </div>
              </RadioGroup>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Job Site Section */}
      <Card>
        <CardHeader>
          <CardTitle>Job Site</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="jobAddress">Address</Label>
              <Input
                id="jobAddress"
                {...register("jobAddress")}
                placeholder="123 Main Street"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerCity">City</Label>
              <Input id="customerCity" {...register("customerCity")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerState">State</Label>
              <select
                id="customerState"
                {...register("customerState")}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Select state</option>
                {FORM_OPTIONS.states.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerZip">ZIP</Label>
              <Input id="customerZip" {...register("customerZip")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="yearBuilt">Year Built</Label>
              <Input id="yearBuilt" {...register("yearBuilt")} placeholder="1990" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="leadTest">Lead Test</Label>
              <Switch
                id="leadTest"
                checked={watch("leadTest") === "Yes"}
                onCheckedChange={(checked) =>
                  setValue("leadTest", checked ? "Yes" : "", { shouldDirty: true })
                }
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="billingAddress">
                Billing Address (if different)
              </Label>
              <Input
                id="billingAddress"
                {...register("billingAddress")}
                placeholder="Leave blank if same as job address"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sales Info Section */}
      <Card>
        <CardHeader>
          <CardTitle>Sales Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="salesman">Salesman</Label>
              <Input id="salesman" {...register("salesman")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="measuredBy">Measured By</Label>
              <Input id="measuredBy" {...register("measuredBy")} />
            </div>
            {salespeople.length > 0 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="salesRepId">Sales Rep (Commission)</Label>
                  <select
                    id="salesRepId"
                    {...register("salesRepId")}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="">Default (current user)</option>
                    {salespeople.map((sp) => (
                      <option key={sp.id} value={sp.id}>
                        {sp.name || sp.email}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="setterId">Setter (Commission)</Label>
                  <select
                    id="setterId"
                    {...register("setterId")}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="">None (self-gen)</option>
                    {salespeople.map((sp) => (
                      <option key={sp.id} value={sp.id}>
                        {sp.name || sp.email}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}
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
          <div className="mt-4 space-y-2">
            <Label htmlFor="windowsBeingRemoved">Windows Being Removed</Label>
            <select
              id="windowsBeingRemoved"
              {...register("windowsBeingRemoved")}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">Select type</option>
              {FORM_OPTIONS.windowsBeingRemoved.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </div>
          <div className="mt-4">
            <Label className="mb-2 block">Application Surface Quantities</Label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="space-y-1">
                <Label
                  htmlFor="brickApplicationQty"
                  className="text-xs text-muted-foreground"
                >
                  Brick
                </Label>
                <Input
                  id="brickApplicationQty"
                  type="number"
                  min="0"
                  {...register("brickApplicationQty")}
                />
              </div>
              <div className="space-y-1">
                <Label
                  htmlFor="stuccoApplicationQty"
                  className="text-xs text-muted-foreground"
                >
                  Stucco
                </Label>
                <Input
                  id="stuccoApplicationQty"
                  type="number"
                  min="0"
                  {...register("stuccoApplicationQty")}
                />
              </div>
              <div className="space-y-1">
                <Label
                  htmlFor="sidingApplicationQty"
                  className="text-xs text-muted-foreground"
                >
                  Siding
                </Label>
                <Input
                  id="sidingApplicationQty"
                  type="number"
                  min="0"
                  {...register("sidingApplicationQty")}
                />
              </div>
              <div className="space-y-1">
                <Label
                  htmlFor="foundationApplicationQty"
                  className="text-xs text-muted-foreground"
                >
                  Foundation
                </Label>
                <Input
                  id="foundationApplicationQty"
                  type="number"
                  min="0"
                  {...register("foundationApplicationQty")}
                />
              </div>
              <div className="space-y-1">
                <Label
                  htmlFor="woodApplicationQty"
                  className="text-xs text-muted-foreground"
                >
                  Wood
                </Label>
                <Input
                  id="woodApplicationQty"
                  type="number"
                  min="0"
                  {...register("woodApplicationQty")}
                />
              </div>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <Label htmlFor="contractNotes">Notes</Label>
            <Textarea
              id="contractNotes"
              {...register("contractNotes")}
              placeholder="Enter contract notes..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
