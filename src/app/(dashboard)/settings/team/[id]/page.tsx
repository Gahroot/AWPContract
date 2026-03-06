"use client";

import { useEffect, useState, use } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CommissionTable } from "@/components/commissions/commission-table";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Save } from "lucide-react";
import Link from "next/link";

interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  role: string;
  market: string;
  isSetterManager: boolean;
  isTerritoryOwner: boolean;
  isVP: boolean;
  isNSM: boolean;
  territoryId: string | null;
  territory: { id: string; name: string } | null;
  createdAt: string;
}

interface CommissionOverride {
  id: string;
  commissionType: string;
  rateOverride: number;
  isActive: boolean;
}

interface Territory {
  id: string;
  name: string;
}

const COMMISSION_TYPES = [
  { value: "SALES_REP", label: "Sales Rep" },
  { value: "SETTER", label: "Setter" },
  { value: "SETTER_MANAGER", label: "Setter Manager" },
  { value: "TERRITORY_OWNER", label: "Territory Owner" },
  { value: "VP", label: "VP" },
  { value: "NSM", label: "NSM" },
];

export default function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [overrides, setOverrides] = useState<CommissionOverride[]>([]);
  const [territories, setTerritories] = useState<Territory[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [commissions, setCommissions] = useState<any[]>([]);
  const [totalEarned, setTotalEarned] = useState(0);
  const [loading, setLoading] = useState(true);
  const [_savingRoles, _setSavingRoles] = useState(false);
  const [savingOverrides, setSavingOverrides] = useState(false);
  const [overrideValues, setOverrideValues] = useState<Record<string, string>>({});

  useEffect(() => {
    async function fetchAll() {
      try {
        const [usersRes, overridesRes, terrRes, commRes] = await Promise.all([
          fetch("/api/users"),
          fetch(`/api/users/${id}/commission-overrides`),
          fetch("/api/territories"),
          fetch(`/api/commissions?userId=${id}&limit=100`),
        ]);

        if (usersRes.ok) {
          const users = await usersRes.json();
          const found = users.find((u: UserProfile) => u.id === id);
          setUser(found ?? null);
        }

        if (overridesRes.ok) {
          const data = await overridesRes.json();
          setOverrides(data);
          const vals: Record<string, string> = {};
          for (const o of data) {
            vals[o.commissionType] = String(Math.round(o.rateOverride * 10000) / 100);
          }
          setOverrideValues(vals);
        }

        if (terrRes.ok) {
          setTerritories(await terrRes.json());
        }

        if (commRes.ok) {
          const commData = await commRes.json();
          setCommissions(commData.records ?? []);
          setTotalEarned(commData.summary?.totalCommission ?? 0);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, [id]);

  async function handleRoleToggle(field: string, value: boolean) {
    if (!user) return;
    const res = await fetch(`/api/users/${id}/roles`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
    if (res.ok) {
      const updated = await res.json();
      setUser((prev) => prev ? { ...prev, ...updated } : prev);
      toast.success("Role updated");
    } else {
      toast.error("Failed to update role");
    }
  }

  async function handleTerritoryChange(territoryId: string) {
    const res = await fetch(`/api/users/${id}/roles`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ territoryId: territoryId || null }),
    });
    if (res.ok) {
      const updated = await res.json();
      setUser((prev) => prev ? { ...prev, ...updated } : prev);
      toast.success("Territory updated");
    }
  }

  async function handleSaveOverrides() {
    setSavingOverrides(true);
    try {
      const overridesList = Object.entries(overrideValues)
        .filter(([, v]) => v !== "" && !isNaN(parseFloat(v)))
        .map(([commissionType, v]) => ({
          commissionType,
          rateOverride: parseFloat(v) / 100,
        }));

      if (overridesList.length === 0) {
        toast.info("No overrides to save");
        return;
      }

      const res = await fetch(`/api/users/${id}/commission-overrides`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ overrides: overridesList }),
      });

      if (res.ok) {
        toast.success("Rate overrides saved");
        const data = await res.json();
        setOverrides(data);
      } else {
        toast.error("Failed to save overrides");
      }
    } finally {
      setSavingOverrides(false);
    }
  }

  async function handleRemoveOverride(type: string) {
    const res = await fetch(`/api/users/${id}/commission-overrides?type=${type}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setOverrides((prev) => prev.filter((o) => o.commissionType !== type));
      setOverrideValues((prev) => {
        const next = { ...prev };
        delete next[type];
        return next;
      });
      toast.success("Override removed");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        User not found.
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Link href="/settings/team">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{user.name || user.email}</h1>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
      </div>

      {/* Section 1: Info */}
      <Card>
        <CardHeader>
          <CardTitle>User Info</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">Role</Label>
              <div className="mt-1">
                <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>
                  {user.role}
                </Badge>
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Market</Label>
              <p className="mt-1 text-sm">{user.market}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Territory</Label>
              <p className="mt-1 text-sm">{user.territory?.name ?? "None"}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Joined</Label>
              <p className="mt-1 text-sm">
                {new Date(user.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Commission Roles */}
      <Card>
        <CardHeader>
          <CardTitle>Commission Roles</CardTitle>
          <CardDescription>Toggle management roles and territory assignment.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Setter Manager</Label>
              <Switch
                checked={user.isSetterManager}
                onCheckedChange={(v) => handleRoleToggle("isSetterManager", v)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm">Territory Owner</Label>
              <Switch
                checked={user.isTerritoryOwner}
                onCheckedChange={(v) => handleRoleToggle("isTerritoryOwner", v)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm">VP</Label>
              <Switch
                checked={user.isVP}
                onCheckedChange={(v) => handleRoleToggle("isVP", v)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm">NSM</Label>
              <Switch
                checked={user.isNSM}
                onCheckedChange={(v) => handleRoleToggle("isNSM", v)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Territory</Label>
            <Select
              value={user.territoryId ?? "none"}
              onValueChange={(v) => handleTerritoryChange(v === "none" ? "" : v)}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select territory" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {territories.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Section 3: Rate Overrides */}
      <Card>
        <CardHeader>
          <CardTitle>Rate Overrides</CardTitle>
          <CardDescription>
            Set custom commission rates that override global settings for this user.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Commission Type</TableHead>
                <TableHead>Custom Rate (%)</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {COMMISSION_TYPES.map((ct) => {
                const hasOverride = overrides.some(
                  (o) => o.commissionType === ct.value
                );
                return (
                  <TableRow key={ct.value}>
                    <TableCell className="font-medium">{ct.label}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        step={0.5}
                        placeholder="Use global"
                        value={overrideValues[ct.value] ?? ""}
                        onChange={(e) =>
                          setOverrideValues((prev) => ({
                            ...prev,
                            [ct.value]: e.target.value,
                          }))
                        }
                        className="w-[120px]"
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      {hasOverride && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveOverride(ct.value)}
                        >
                          Remove
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <Button onClick={handleSaveOverrides} disabled={savingOverrides}>
            {savingOverrides && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            <Save className="h-4 w-4 mr-2" />
            Save Overrides
          </Button>
        </CardContent>
      </Card>

      {/* Section 4: Earnings History */}
      <Card>
        <CardHeader>
          <CardTitle>Earnings History</CardTitle>
          <CardDescription>
            Total earned: ${totalEarned.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {commissions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No commission records yet.
            </p>
          ) : (
            <CommissionTable records={commissions} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
