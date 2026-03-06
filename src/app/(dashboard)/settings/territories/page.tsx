"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Plus, ArrowLeft, Trash2, Users } from "lucide-react";
import Link from "next/link";

interface TerritoryOwner {
  id: string;
  name: string | null;
  email: string;
}

interface Territory {
  id: string;
  name: string;
  market: string;
  isActive: boolean;
  _count: { users: number };
  users: TerritoryOwner[];
}

interface TerritoryUser {
  id: string;
  name: string | null;
  email: string;
  isTerritoryOwner: boolean;
}

export default function TerritoriesPage() {
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newMarket, setNewMarket] = useState("SLC");
  const [creating, setCreating] = useState(false);

  // Manage owners dialog state
  const [manageDialogOpen, setManageDialogOpen] = useState(false);
  const [manageTerritoryName, setManageTerritoryName] = useState("");
  const [territoryUsers, setTerritoryUsers] = useState<TerritoryUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  async function fetchTerritories() {
    try {
      const res = await fetch("/api/territories?all=true");
      if (res.ok) setTerritories(await res.json());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTerritories();
  }, []);

  async function handleCreate() {
    setCreating(true);
    try {
      const res = await fetch("/api/territories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, market: newMarket }),
      });
      if (res.ok) {
        toast.success("Territory created");
        setNewName("");
        setNewMarket("SLC");
        setDialogOpen(false);
        fetchTerritories();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to create territory");
      }
    } finally {
      setCreating(false);
    }
  }

  async function toggleActive(id: string, isActive: boolean) {
    const res = await fetch(`/api/territories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive }),
    });
    if (res.ok) {
      fetchTerritories();
      toast.success(isActive ? "Territory activated" : "Territory deactivated");
    } else {
      toast.error("Failed to update territory");
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/territories/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Territory removed");
      fetchTerritories();
    } else {
      toast.error("Failed to delete territory");
    }
  }

  async function openManageDialog(territory: Territory) {
    setManageTerritoryName(territory.name);
    setManageDialogOpen(true);
    setLoadingUsers(true);
    try {
      const res = await fetch(`/api/territories/${territory.id}`);
      if (res.ok) {
        const data = await res.json();
        setTerritoryUsers(data.users);
      } else {
        toast.error("Failed to load territory users");
      }
    } finally {
      setLoadingUsers(false);
    }
  }

  async function toggleTerritoryOwner(userId: string, value: boolean) {
    const res = await fetch(`/api/users/${userId}/roles`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isTerritoryOwner: value }),
    });
    if (res.ok) {
      setTerritoryUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, isTerritoryOwner: value } : u))
      );
      fetchTerritories();
      toast.success(value ? "Territory owner assigned" : "Territory owner removed");
    } else {
      toast.error("Failed to update role");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Link href="/settings">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Territory Management</h1>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Territories</CardTitle>
            <CardDescription>
              Manage sales territories for commission tracking.
            </CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Territory
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Territory</DialogTitle>
                <DialogDescription>
                  Create a new sales territory.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    placeholder="e.g. SLC, Orem, Phoenix"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Market</Label>
                  <Select value={newMarket} onValueChange={setNewMarket}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SLC">SLC</SelectItem>
                      <SelectItem value="Phoenix">Phoenix</SelectItem>
                      <SelectItem value="Vancouver">Vancouver</SelectItem>
                      <SelectItem value="OREM">OREM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreate} disabled={creating || !newName.trim()}>
                  {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Market</TableHead>
                <TableHead>Territory Owner</TableHead>
                <TableHead className="text-center">Users</TableHead>
                <TableHead className="text-center">Active</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {territories.map((territory) => (
                <TableRow key={territory.id}>
                  <TableCell className="font-medium">{territory.name}</TableCell>
                  <TableCell>{territory.market}</TableCell>
                  <TableCell>
                    {territory.users.length > 0 ? (
                      <span className="text-sm">
                        {territory.users.map((u) => u.name || u.email).join(", ")}
                      </span>
                    ) : (
                      <Badge variant="destructive" className="text-xs">
                        None
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {territory._count.users}
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={territory.isActive}
                      onCheckedChange={(v) => toggleActive(territory.id, v)}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openManageDialog(territory)}
                        title="Manage territory owners"
                      >
                        <Users className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(territory.id)}
                        title="Delete territory"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {territories.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No territories yet. Add one to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Manage Territory Owners Dialog */}
      <Dialog open={manageDialogOpen} onOpenChange={setManageDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Owners - {manageTerritoryName}</DialogTitle>
            <DialogDescription>
              Toggle territory owner for users assigned to this territory.
            </DialogDescription>
          </DialogHeader>
          {loadingUsers ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : territoryUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No users assigned to this territory. Assign users from the Team Management page.
            </p>
          ) : (
            <div className="space-y-3">
              {territoryUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="text-sm font-medium">{user.name || "Unnamed"}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-muted-foreground">Owner</Label>
                    <Switch
                      checked={user.isTerritoryOwner}
                      onCheckedChange={(v) => toggleTerritoryOwner(user.id, v)}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
