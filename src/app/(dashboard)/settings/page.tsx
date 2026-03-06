"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, CheckCircle, DollarSign, Users, MapPin } from "lucide-react";
import Link from "next/link";

interface SettingsData {
  company_name: string;
  company_phone: string;
  company_address: string;
  hubspot_api_key: string;
  hubspot_sync_enabled: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsData>({
    company_name: "",
    company_phone: "",
    company_address: "",
    hubspot_api_key: "",
    hubspot_sync_enabled: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load");
        return r.json();
      })
      .then(setSettings)
      .catch(() => setError("Something went wrong. Please try again."))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        toast.success("Settings saved");
      } else {
        toast.error("Failed to save settings");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleTestHubSpot() {
    setTesting(true);
    try {
      const res = await fetch("/api/hubspot/test", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        toast.success("HubSpot connection successful");
      } else {
        toast.error(data.error || "HubSpot connection failed");
      }
    } catch {
      toast.error("Failed to test connection");
    } finally {
      setTesting(false);
    }
  }

  if (loading) return null;

  if (error) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
          <CardDescription>
            This information appears on contracts and PDFs.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Company Name</Label>
            <Input
              value={settings.company_name}
              onChange={(e) =>
                setSettings((s) => ({ ...s, company_name: e.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input
              value={settings.company_phone}
              onChange={(e) =>
                setSettings((s) => ({ ...s, company_phone: e.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Address</Label>
            <Input
              value={settings.company_address}
              onChange={(e) =>
                setSettings((s) => ({ ...s, company_address: e.target.value }))
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>HubSpot Integration</CardTitle>
          <CardDescription>
            Enter your HubSpot private app access token to enable CRM sync.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>API Access Token</Label>
            <Input
              type="password"
              value={settings.hubspot_api_key}
              onChange={(e) =>
                setSettings((s) => ({ ...s, hubspot_api_key: e.target.value }))
              }
              placeholder="pat-na1-..."
            />
          </div>
          <Button
            variant="outline"
            onClick={handleTestHubSpot}
            disabled={testing || !settings.hubspot_api_key}
          >
            {testing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-2" />
            )}
            Test Connection
          </Button>
          <Separator className="my-4" />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable HubSpot Sync</Label>
              <p className="text-sm text-muted-foreground">
                When disabled, sync operations log to console but do not send data to HubSpot
              </p>
            </div>
            <Switch
              checked={settings.hubspot_sync_enabled === "true"}
              onCheckedChange={(checked) =>
                setSettings((s) => ({ ...s, hubspot_sync_enabled: checked ? "true" : "false" }))
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Team Management</CardTitle>
          <CardDescription>
            Manage team members and invite new users to the system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/settings/team">
            <Button variant="outline">
              <Users className="h-4 w-4 mr-2" />
              Manage Team
            </Button>
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Territories</CardTitle>
          <CardDescription>
            Manage sales territories for commission tracking.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/settings/territories">
            <Button variant="outline">
              <MapPin className="h-4 w-4 mr-2" />
              Manage Territories
            </Button>
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Commission Settings</CardTitle>
          <CardDescription>
            Configure how salesperson commissions are calculated.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/settings/commissions">
            <Button variant="outline">
              <DollarSign className="h-4 w-4 mr-2" />
              Manage Commissions
            </Button>
          </Link>
        </CardContent>
      </Card>

      <Separator />

      <Button onClick={handleSave} disabled={saving}>
        {saving ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : null}
        Save Settings
      </Button>
    </div>
  );
}
