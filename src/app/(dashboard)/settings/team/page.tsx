"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { Loader2, UserPlus, Copy, X, ArrowLeft, MoreHorizontal, RefreshCw, Sliders, User as UserIcon } from "lucide-react";
import Link from "next/link";
import { TerritoryCombobox } from "@/components/shared/territory-combobox";

interface TerritoryOption {
  id: string;
  name: string;
}

interface User {
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

interface Invite {
  id: string;
  token: string;
  email: string;
  role: string;
  status: string;
  market: string;
  expiresAt: string;
  createdAt: string;
  invitedBy: { name: string | null; email: string };
  acceptedBy: { name: string | null; email: string } | null;
}

export default function TeamManagementPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";
  const [users, setUsers] = useState<User[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [territoryOptions, setTerritoryOptions] = useState<TerritoryOption[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("SALESMAN");
  const [inviteStep, setInviteStep] = useState(1);
  const [inviteSetterMgr, setInviteSetterMgr] = useState(false);
  const [inviteTerritoryOwner, setInviteTerritoryOwner] = useState(false);
  const [inviteVP, setInviteVP] = useState(false);
  const [inviteNSM, setInviteNSM] = useState(false);
  const [inviteTerritoryId, setInviteTerritoryId] = useState("");
  const [creating, setCreating] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);

  async function fetchData() {
    try {
      const usersRes = await fetch("/api/users");
      if (usersRes.ok) setUsers(await usersRes.json());

      // Only fetch admin-specific data for admins
      if (isAdmin) {
        const [invitesRes, terrRes] = await Promise.all([
          fetch("/api/invites"),
          fetch("/api/users/territories"),
        ]);
        if (invitesRes.ok) setInvites(await invitesRes.json());
        if (terrRes.ok) {
          const territories = await terrRes.json();
          setTerritoryOptions(territories.map((t: { id: string; name: string }) => ({ id: t.id, name: t.name })));
        }
      }
    } finally {
      setLoading(false);
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchData(); }, [isAdmin]);

  async function toggleRole(userId: string, field: string, value: boolean) {
    const res = await fetch(`/api/users/${userId}/roles`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
    if (res.ok) {
      const updated = await res.json();
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, ...updated } : u))
      );
      toast.success("Role updated");

      // Warn if territory owner toggled on without a territory
      if (field === "isTerritoryOwner" && value && !updated.territoryId) {
        toast.warning("Please assign a territory for this user to activate territory owner commissions");
      }
    } else {
      toast.error("Failed to update role");
    }
  }

  async function fetchTerritories() {
    const res = await fetch("/api/users/territories");
    if (res.ok) {
      const territories = await res.json();
      setTerritoryOptions(territories.map((t: { id: string; name: string }) => ({ id: t.id, name: t.name })));
    }
  }

  async function updateTerritory(userId: string, territory: TerritoryOption) {
    const res = await fetch(`/api/users/${userId}/roles`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ territoryId: territory.id }),
    });
    if (res.ok) {
      const updated = await res.json();
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, ...updated } : u))
      );
      await fetchTerritories();
    }
  }

  async function handleCreateInvite() {
    setCreating(true);
    try {
      const res = await fetch("/api/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole,
          isSetterManager: inviteSetterMgr,
          isTerritoryOwner: inviteTerritoryOwner,
          isVP: inviteVP,
          isNSM: inviteNSM,
          territoryId: inviteTerritoryId || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setInviteUrl(data.url);
        toast.success("Invite created");
        fetchData();
      } else {
        toast.error(data.error || "Failed to create invite");
      }
    } catch {
      toast.error("Failed to create invite");
    } finally {
      setCreating(false);
    }
  }

  async function handleRevoke(id: string) {
    const res = await fetch(`/api/invites/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Invite revoked");
      fetchData();
    } else {
      toast.error("Failed to revoke invite");
    }
  }

  function copyLink(token: string) {
    const url = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard");
  }

  async function handleRecalculateUser(userId: string) {
    try {
      const res = await fetch("/api/commissions/recalculate-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Recalculated ${data.succeeded} of ${data.processed} contracts`);
      } else {
        toast.error(data.error ?? "Recalculation failed");
      }
    } catch {
      toast.error("Recalculation failed");
    }
  }

  function handleDialogClose(open: boolean) {
    setDialogOpen(open);
    if (!open) {
      setInviteEmail("");
      setInviteRole("SALESMAN");
      setInviteStep(1);
      setInviteSetterMgr(false);
      setInviteTerritoryOwner(false);
      setInviteVP(false);
      setInviteNSM(false);
      setInviteTerritoryId("");
      setInviteUrl(null);
    }
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-4">
        <Link href="/settings">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Team Management</h1>
      </div>

      {/* Team Members with Role Toggles */}
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>
            {isAdmin ? "Manage user roles and commission management flags." : "View your team members."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                {isAdmin && <TableHead className="text-center">Setter Mgr</TableHead>}
                {isAdmin && <TableHead className="text-center">Terr. Owner</TableHead>}
                {isAdmin && <TableHead className="text-center">VP</TableHead>}
                {isAdmin && <TableHead className="text-center">NSM</TableHead>}
                <TableHead>Territory</TableHead>
                {isAdmin && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    <Link href={`/settings/team/${user.id}`} className="hover:underline text-primary">
                      {user.name || "—"}
                    </Link>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        user.role === "ADMIN" ? "default" : "secondary"
                      }
                    >
                      {user.role}
                    </Badge>
                  </TableCell>
                  {isAdmin && (
                    <TableCell className="text-center">
                      <Switch
                        checked={user.isSetterManager}
                        onCheckedChange={(v) => toggleRole(user.id, "isSetterManager", v)}
                      />
                    </TableCell>
                  )}
                  {isAdmin && (
                    <TableCell className="text-center">
                      <Switch
                        checked={user.isTerritoryOwner}
                        onCheckedChange={(v) => toggleRole(user.id, "isTerritoryOwner", v)}
                      />
                    </TableCell>
                  )}
                  {isAdmin && (
                    <TableCell className="text-center">
                      <Switch
                        checked={user.isVP}
                        onCheckedChange={(v) => toggleRole(user.id, "isVP", v)}
                      />
                    </TableCell>
                  )}
                  {isAdmin && (
                    <TableCell className="text-center">
                      <Switch
                        checked={user.isNSM}
                        onCheckedChange={(v) => toggleRole(user.id, "isNSM", v)}
                      />
                    </TableCell>
                  )}
                  <TableCell>
                    {isAdmin ? (
                      <div className={user.isTerritoryOwner && !user.territoryId ? "rounded ring-2 ring-destructive" : ""}>
                        <TerritoryCombobox
                          value={user.territory}
                          options={territoryOptions}
                          onChange={(t) => updateTerritory(user.id, t)}
                          placeholder={user.isTerritoryOwner && !user.territoryId ? "Assign territory!" : user.market}
                        />
                      </div>
                    ) : (
                      <span className="text-sm">{user.territory?.name || user.market || "—"}</span>
                    )}
                  </TableCell>
                  {isAdmin && (
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/settings/team/${user.id}`}>
                              <UserIcon className="h-4 w-4 mr-2" />
                              View Profile
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/settings/team/${user.id}#overrides`}>
                              <Sliders className="h-4 w-4 mr-2" />
                              Rate Overrides
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleRecalculateUser(user.id)}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Recalculate Commissions
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Invitations (admin only) */}
      {isAdmin && <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Invitations</CardTitle>
            <CardDescription>
              Invite new users by generating a secure link.
            </CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Invite User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite a New User</DialogTitle>
                <DialogDescription>
                  Send them the invite link to create their account.
                </DialogDescription>
              </DialogHeader>
              {inviteUrl ? (
                <div className="space-y-3">
                  <Label>Invite Link</Label>
                  <div className="flex gap-2">
                    <Input value={inviteUrl} readOnly className="text-sm" />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        navigator.clipboard.writeText(inviteUrl);
                        toast.success("Link copied");
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    This link expires in 7 days.
                  </p>
                </div>
              ) : inviteStep === 1 ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      placeholder="user@example.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Select value={inviteRole} onValueChange={setInviteRole}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SALESMAN">Salesman</SelectItem>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ) : inviteStep === 2 ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Territory</Label>
                    <Select value={inviteTerritoryId || "none"} onValueChange={(v) => setInviteTerritoryId(v === "none" ? "" : v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select territory" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {territoryOptions.map((t) => (
                          <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-3">
                    <Label>Management Flags</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-normal">Setter Manager</Label>
                        <Switch checked={inviteSetterMgr} onCheckedChange={setInviteSetterMgr} />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-normal">Territory Owner</Label>
                        <Switch checked={inviteTerritoryOwner} onCheckedChange={setInviteTerritoryOwner} />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-normal">VP</Label>
                        <Switch checked={inviteVP} onCheckedChange={setInviteVP} />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-normal">NSM</Label>
                        <Switch checked={inviteNSM} onCheckedChange={setInviteNSM} />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="rounded-lg border p-3 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Email</span>
                      <span className="font-medium">{inviteEmail}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Role</span>
                      <span className="font-medium">{inviteRole}</span>
                    </div>
                    {inviteTerritoryId && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Territory</span>
                        <span className="font-medium">{territoryOptions.find(t => t.id === inviteTerritoryId)?.name ?? "—"}</span>
                      </div>
                    )}
                    {(inviteSetterMgr || inviteTerritoryOwner || inviteVP || inviteNSM) && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Flags</span>
                        <span className="font-medium">
                          {[inviteSetterMgr && "Setter Mgr", inviteTerritoryOwner && "Territory", inviteVP && "VP", inviteNSM && "NSM"].filter(Boolean).join(", ")}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {!inviteUrl && (
                <DialogFooter className="flex gap-2">
                  {inviteStep > 1 && (
                    <Button variant="outline" onClick={() => setInviteStep(inviteStep - 1)}>
                      Back
                    </Button>
                  )}
                  {inviteStep < 3 ? (
                    <Button
                      onClick={() => setInviteStep(inviteStep + 1)}
                      disabled={inviteStep === 1 && !inviteEmail}
                    >
                      Next
                    </Button>
                  ) : (
                    <Button
                      onClick={handleCreateInvite}
                      disabled={creating || !inviteEmail}
                    >
                      {creating && (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      )}
                      Create Invite
                    </Button>
                  )}
                </DialogFooter>
              )}
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {invites.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No invitations yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Invited By</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invites.map((invite) => (
                  <TableRow key={invite.id}>
                    <TableCell className="font-medium">
                      {invite.email}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          invite.role === "ADMIN" ? "default" : "secondary"
                        }
                      >
                        {invite.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          invite.status === "ACCEPTED"
                            ? "success"
                            : invite.status === "REVOKED"
                              ? "destructive"
                              : "outline"
                        }
                      >
                        {invite.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {invite.invitedBy.name || invite.invitedBy.email}
                    </TableCell>
                    <TableCell>{formatDate(invite.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      {invite.status === "PENDING" && (
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => copyLink(invite.token)}
                            title="Copy invite link"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRevoke(invite.id)}
                            title="Revoke invite"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>}
    </div>
  );
}
