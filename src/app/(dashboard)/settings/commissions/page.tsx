"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, RefreshCw, ArrowLeft } from "lucide-react";
import { CommissionSettingsSection } from "@/components/commissions/commission-settings-section";
import { RoleWarnings } from "@/components/commissions/role-warnings";
import Link from "next/link";

interface AssignedUser {
  name: string | null;
  email: string;
}

const DEFAULT_SETTINGS: Record<string, number> = {
  salesRepRate: 0.10,
  salesRepRateBelowFair: 0.05,
  salesRepFloor: 0.85,
  salesRepCeiling: 1.15,
  setterRate: 0.03,
  setterFloor: 0.85,
  setterManagerRate: 0.02,
  setterManagerRateBelowFair: 0.01,
  territoryOwnerRateTier1: 0.01,
  territoryOwnerRateTier2: 0.015,
  territoryOwnerRateTier3: 0.02,
  territoryOwnerTier2Threshold: 500000,
  territoryOwnerTier3Threshold: 1000000,
  vpRate: 0.01,
  vpRateBelowFair: 0.005,
  nsmRate: 0.005,
  nsmRateBelowFair: 0.0025,
  traditionalSalesRepRate: 0.12,
  traditionalSalesRepRateBelowFair: 0.07,
  traditionalFloorRate: 0.85,
  traditionalPriceCeiling: 1.15,
  traditionalNsmOverrideRate: 0.005,
  traditionalNsmOverrideRateBelowFair: 0.0025,
};

export default function CommissionSettingsPage() {
  const [values, setValues] = useState<Record<string, number>>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [roleUsers, setRoleUsers] = useState<Record<string, AssignedUser[]>>({});

  useEffect(() => {
    async function load() {
      try {
        const [configRes, usersRes] = await Promise.all([
          fetch("/api/commissions/config"),
          fetch("/api/users"),
        ]);
        const data = await configRes.json();
        if (data.settings) {
          const s = data.settings;
          const merged = { ...DEFAULT_SETTINGS };
          for (const key of Object.keys(merged)) {
            if (s[key] !== undefined && s[key] !== null) {
              merged[key] = s[key];
            }
          }
          setValues(merged);
        }

        if (usersRes.ok) {
          const users = await usersRes.json();
          const grouped: Record<string, AssignedUser[]> = {
            setterManager: [],
            territoryOwner: [],
            vp: [],
            nsm: [],
          };
          for (const u of users) {
            if (u.isSetterManager) grouped.setterManager.push({ name: u.name, email: u.email });
            if (u.isTerritoryOwner) grouped.territoryOwner.push({ name: u.name, email: u.email });
            if (u.isVP) grouped.vp.push({ name: u.name, email: u.email });
            if (u.isNSM) grouped.nsm.push({ name: u.name, email: u.email });
          }
          setRoleUsers(grouped);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function updateValue(key: string, value: number) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/commissions/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
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
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center gap-4">
        <Link href="/settings">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Commission Settings</h1>
          <p className="text-sm text-muted-foreground">
            Configure commission rates for all roles. Rates are applied simultaneously
            when a contract is completed.
          </p>
        </div>
      </div>

      <RoleWarnings />

      <Tabs defaultValue="setter-set">
        <TabsList>
          <TabsTrigger value="setter-set">Setter-Set</TabsTrigger>
          <TabsTrigger value="self-gen">Self-Gen / Traditional</TabsTrigger>
        </TabsList>

        <TabsContent value="setter-set" className="space-y-4">
          <CommissionSettingsSection
            title="Sales Rep"
            description="Commission for the closer on setter-set appointments."
            defaultOpen
            fields={[
              { key: "salesRepRate", label: "Rate (at/above fair price)", type: "percent", helpText: "Applied when contract total >= fair price" },
              { key: "salesRepRateBelowFair", label: "Rate (below fair price)", type: "percent", helpText: "Applied when contract total < fair price" },
              { key: "salesRepFloor", label: "Floor (% of fair price)", type: "multiplier", step: 1, helpText: "Minimum contract/fair ratio to earn commission" },
              { key: "salesRepCeiling", label: "Ceiling (% of fair price)", type: "multiplier", step: 1, helpText: "Maximum commissionable revenue cap" },
            ]}
            values={values}
            onChange={updateValue}
          />

          <CommissionSettingsSection
            title="Setter"
            description="Commission for the appointment setter (setter-set only)."
            fields={[
              { key: "setterRate", label: "Rate", type: "percent", helpText: "Applied on full contract total" },
              { key: "setterFloor", label: "Floor (% of fair price)", type: "multiplier", step: 1 },
            ]}
            values={values}
            onChange={updateValue}
          />

          <CommissionSettingsSection
            title="Setter Manager"
            description="Override for setter managers on all contracts."
            assignedUsers={roleUsers.setterManager}
            fields={[
              { key: "setterManagerRate", label: "Rate (at/above fair price)", type: "percent" },
              { key: "setterManagerRateBelowFair", label: "Rate (below fair price)", type: "percent" },
            ]}
            values={values}
            onChange={updateValue}
          />

          <CommissionSettingsSection
            title="Territory Owner"
            description="Tiered override based on cumulative territory revenue (current year)."
            assignedUsers={roleUsers.territoryOwner}
            fields={[
              { key: "territoryOwnerRateTier1", label: "Tier 1 Rate", type: "percent", helpText: "Base rate before any threshold is met" },
              { key: "territoryOwnerTier2Threshold", label: "Tier 2 Threshold", type: "dollar", helpText: "Cumulative YTD revenue to unlock Tier 2" },
              { key: "territoryOwnerRateTier2", label: "Tier 2 Rate", type: "percent" },
              { key: "territoryOwnerTier3Threshold", label: "Tier 3 Threshold", type: "dollar", helpText: "Cumulative YTD revenue to unlock Tier 3" },
              { key: "territoryOwnerRateTier3", label: "Tier 3 Rate", type: "percent" },
            ]}
            values={values}
            onChange={updateValue}
          />

          <CommissionSettingsSection
            title="VP"
            description="Override for VPs on all contracts."
            assignedUsers={roleUsers.vp}
            fields={[
              { key: "vpRate", label: "Rate (at/above fair price)", type: "percent" },
              { key: "vpRateBelowFair", label: "Rate (below fair price)", type: "percent" },
            ]}
            values={values}
            onChange={updateValue}
          />

          <CommissionSettingsSection
            title="NSM (National Sales Manager)"
            description="Override for NSM on setter-set contracts."
            assignedUsers={roleUsers.nsm}
            fields={[
              { key: "nsmRate", label: "Rate (at/above fair price)", type: "percent" },
              { key: "nsmRateBelowFair", label: "Rate (below fair price)", type: "percent" },
            ]}
            values={values}
            onChange={updateValue}
          />
        </TabsContent>

        <TabsContent value="self-gen" className="space-y-4">
          <CommissionSettingsSection
            title="Traditional / Self-Gen Sales"
            description="Rates when the sales rep is also the setter (no separate setter)."
            defaultOpen
            fields={[
              { key: "traditionalSalesRepRate", label: "Sales Rep Rate (at/above fair)", type: "percent", helpText: "Higher rate since rep is also the setter" },
              { key: "traditionalSalesRepRateBelowFair", label: "Sales Rep Rate (below fair)", type: "percent" },
              { key: "traditionalFloorRate", label: "Floor (% of fair price)", type: "multiplier", step: 1 },
              { key: "traditionalPriceCeiling", label: "Ceiling (% of fair price)", type: "multiplier", step: 1 },
              { key: "traditionalNsmOverrideRate", label: "NSM Override Rate (at/above fair)", type: "percent" },
              { key: "traditionalNsmOverrideRateBelowFair", label: "NSM Override Rate (below fair)", type: "percent" },
            ]}
            values={values}
            onChange={updateValue}
          />
        </TabsContent>
      </Tabs>

      <div className="flex gap-3 pt-2">
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
