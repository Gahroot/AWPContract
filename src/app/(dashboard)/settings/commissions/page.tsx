"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, RefreshCw } from "lucide-react";
import {
  TierEditor,
  type TierRow,
} from "@/components/commissions/tier-editor";
import {
  SalespersonRateEditor,
  type SalespersonRate,
} from "@/components/commissions/salesperson-rate-editor";

type ModelType = "FLAT_PERCENT" | "PER_SALESPERSON" | "TIERED";

export default function CommissionSettingsPage() {
  const [modelType, setModelType] = useState<ModelType>("FLAT_PERCENT");
  const [flatRate, setFlatRate] = useState(10);
  const [tiers, setTiers] = useState<TierRow[]>([]);
  const [salespersonRates, setSalespersonRates] = useState<SalespersonRate[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [configRes, usersRes] = await Promise.all([
          fetch("/api/commissions/config"),
          fetch("/api/commissions/config"), // same endpoint returns rates
        ]);
        const configData = await configRes.json();
        // usersRes is same data, we just need the salesperson rates
        const _usersData = await usersRes.json();

        if (configData.config) {
          setModelType(configData.config.modelType ?? "FLAT_PERCENT");
          setFlatRate((configData.config.flatRate ?? 0.1) * 100);
        }
        if (configData.tiers) {
          setTiers(configData.tiers);
        }

        // Build salesperson rates with user info
        // Fetch all salesperson users
        const allUsersRes = await fetch("/api/commissions/config");
        const allUsersData = await allUsersRes.json();
        const existingRates = allUsersData.salespersonRates ?? [];

        // We need list of all salespeople - get from rates endpoint user data
        // For now, use what we have from the config endpoint
        const ratesList: SalespersonRate[] = existingRates.map(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (r: any) => ({
            userId: r.userId ?? r.user?.id,
            name: r.user?.name ?? "",
            email: r.user?.email ?? "",
            rate: r.rate ?? 0,
          })
        );
        setSalespersonRates(ratesList);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        modelType,
        flatRate: flatRate / 100,
      };
      if (modelType === "TIERED") {
        body.tiers = tiers.map((t, i) => ({
          minAmount: t.minAmount,
          maxAmount: t.maxAmount,
          rate: t.rate,
          sortOrder: i,
        }));
      }
      if (modelType === "PER_SALESPERSON") {
        body.salespersonRates = salespersonRates.map((sr) => ({
          userId: sr.userId,
          rate: sr.rate,
        }));
      }

      const res = await fetch("/api/commissions/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        toast.success("Commission settings saved");
      } else {
        const data = await res.json();
        toast.error(data.error ?? "Failed to save");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleRecalculate() {
    setRecalculating(true);
    setConfirmOpen(false);
    try {
      const res = await fetch("/api/commissions/recalculate", {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(
          `Recalculated ${data.succeeded} of ${data.processed} contracts`
        );
      } else {
        toast.error(data.error ?? "Recalculation failed");
      }
    } finally {
      setRecalculating(false);
    }
  }

  if (loading) return null;

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">Commission Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Commission Model</CardTitle>
          <CardDescription>
            Choose how commissions are calculated for completed contracts.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <RadioGroup
            value={modelType}
            onValueChange={(v) => setModelType(v as ModelType)}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="FLAT_PERCENT" id="flat" />
              <Label htmlFor="flat">Flat Percentage</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="PER_SALESPERSON" id="per-sp" />
              <Label htmlFor="per-sp">Per-Salesperson Rates</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="TIERED" id="tiered" />
              <Label htmlFor="tiered">Tiered / Graduated</Label>
            </div>
          </RadioGroup>

          <Separator />

          {/* Flat rate input (shown for FLAT and as fallback for PER_SALESPERSON) */}
          {(modelType === "FLAT_PERCENT" ||
            modelType === "PER_SALESPERSON") && (
            <div className="space-y-2">
              <Label>
                {modelType === "PER_SALESPERSON"
                  ? "Fallback Rate (%)"
                  : "Commission Rate (%)"}
              </Label>
              <Input
                type="number"
                min={0}
                max={100}
                step={0.5}
                value={flatRate}
                onChange={(e) => setFlatRate(parseFloat(e.target.value) || 0)}
                className="max-w-[200px]"
              />
              <p className="text-xs text-muted-foreground">
                {modelType === "PER_SALESPERSON"
                  ? "Used when a salesperson has no individual rate set."
                  : "Applied to all completed contracts."}
              </p>
            </div>
          )}

          {/* Per-salesperson rates */}
          {modelType === "PER_SALESPERSON" && (
            <div className="space-y-2">
              <Label>Salesperson Rates</Label>
              <SalespersonRateEditor
                rates={salespersonRates}
                onChange={setSalespersonRates}
              />
            </div>
          )}

          {/* Tiered editor */}
          {modelType === "TIERED" && (
            <div className="space-y-2">
              <Label>Commission Tiers</Label>
              <TierEditor tiers={tiers} onChange={setTiers} />
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Save Settings
        </Button>

        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" disabled={recalculating}>
              {recalculating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Recalculate All
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Recalculate All Commissions</DialogTitle>
              <DialogDescription>
                This will recalculate commissions for all completed contracts
                using the current settings. Existing commission records will be
                replaced.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setConfirmOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleRecalculate}>Confirm</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
