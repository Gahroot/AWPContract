"use client";

import { useFormContext } from "react-hook-form";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { FORM_OPTIONS } from "@/lib/constants";

export function StepCustomer() {
  const { register, setValue, watch } = useFormContext();

  // Fetch salespeople for setter dropdown
  const [salespeople, setSalespeople] = useState<
    { id: string; name: string | null; email: string }[]
  >([]);
  useEffect(() => {
    fetch("/api/users/salespeople")
      .then((res) => (res.ok ? res.json() : []))
      .then(setSalespeople)
      .catch(() => {});
  }, []);

  const selfGeneratedLead = watch("selfGeneratedLead") || false;

  // Sync firstName + lastName → customerName
  const handleNameBlur = () => {
    const first = watch("customerFirstName") || "";
    const last = watch("customerLastName") || "";
    if (first || last) {
      setValue("customerName", `${first} ${last}`.trim(), { shouldDirty: true });
    }
  };

  return (
    <div className="space-y-6">
      {/* Customer Information */}
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
                {...register("customerFirstName", { onBlur: handleNameBlur })}
                placeholder="John"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerLastName">
                Last Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="customerLastName"
                {...register("customerLastName", { onBlur: handleNameBlur })}
                placeholder="Doe"
              />
              <input type="hidden" {...register("customerName")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerPhone">
                Phone <span className="text-destructive">*</span>
              </Label>
              <Input
                id="customerPhone"
                {...register("customerPhone")}
                placeholder="(801) 555-0000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerEmail">
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="customerEmail"
                type="email"
                {...register("customerEmail")}
                placeholder="customer@email.com"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Job Site */}
      <Card>
        <CardHeader>
          <CardTitle>Job Site</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="jobAddress">
                Street Address <span className="text-destructive">*</span>
              </Label>
              <Input
                id="jobAddress"
                {...register("jobAddress")}
                placeholder="123 Main Street"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customerCity">
                  City <span className="text-destructive">*</span>
                </Label>
                <Input id="customerCity" {...register("customerCity")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerState">
                  State <span className="text-destructive">*</span>
                </Label>
                <select
                  id="customerState"
                  {...register("customerState")}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">Select</option>
                  {FORM_OPTIONS.states.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerZip">
                  ZIP <span className="text-destructive">*</span>
                </Label>
                <Input id="customerZip" {...register("customerZip")} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="yearBuilt">Year Built</Label>
                <Input id="yearBuilt" {...register("yearBuilt")} placeholder="1990" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="leadTest">Pre-1978 Lead Test Required</Label>
                <div className="flex items-center h-9">
                  <Switch
                    id="leadTest"
                    checked={watch("leadTest") === "Yes"}
                    onCheckedChange={(checked) =>
                      setValue("leadTest", checked ? "Yes" : "", { shouldDirty: true })
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sales Information */}
      <Card>
        <CardHeader>
          <CardTitle>Sales Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="salesman">Salesman</Label>
                <Input
                  id="salesman"
                  {...register("salesman")}
                  readOnly
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quoteDate">Quote Date</Label>
                <Input
                  id="quoteDate"
                  type="date"
                  {...register("quoteDate")}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="selfGeneratedLead">Self-Generated Lead</Label>
                <div className="flex items-center h-9">
                  <Switch
                    id="selfGeneratedLead"
                    checked={selfGeneratedLead}
                    onCheckedChange={(checked) =>
                      setValue("selfGeneratedLead", checked, { shouldDirty: true })
                    }
                  />
                </div>
              </div>
              {!selfGeneratedLead && salespeople.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="setterId">
                    Setter <span className="text-destructive">*</span>
                  </Label>
                  <select
                    id="setterId"
                    {...register("setterId")}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="">Select setter...</option>
                    {salespeople.map((sp) => (
                      <option key={sp.id} value={sp.id}>
                        {sp.name || sp.email}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="contractNotes">Notes</Label>
              <Textarea
                id="contractNotes"
                {...register("contractNotes")}
                placeholder="Enter contract notes..."
                rows={3}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
