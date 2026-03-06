"use client";

import { useFormContext } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function AddendumStep() {
  const { register } = useFormContext();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">Additional Details</h2>

        <Card>
          <CardHeader>
            <CardTitle>Marketing & Plan Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="planNumber">Plan #</Label>
                <Input id="planNumber" {...register("planNumber")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="authNumber">Auth #</Label>
                <Input id="authNumber" {...register("authNumber")} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
