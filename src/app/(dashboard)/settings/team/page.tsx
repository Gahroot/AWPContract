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
import { Loader2, UserPlus, Copy, X, ArrowLeft } from "lucide-react";
import Link from "next/link";

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
  territory: string | null;
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
  const [users, setUsers] = useState<User[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("SALESMAN");
  const [creating, setCreating] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);

  async function fetchData() {
    try {
      const [usersRes, invitesRes] = await Promise.all([
        fetch("/api/users"),
        fetch("/api/invites"),
      ]);
      if (usersRes.ok) setUsers(await usersRes.json());
      if (invitesRes.ok) setInvites(await invitesRes.json());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

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
    } else {
      toast.error("Failed to update role");
    }
  }

  async function updateTerritory(userId: string, territory: string) {
    const res = await fetch(`/api/users/${userId}/roles`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ territory }),
    });
    if (res.ok) {
      const updated = await res.json();
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, ...updated } : u))
      );
    }
  }

  async function handleCreateInvite() {
    setCreating(true);
    try {
      const res = await fetch("/api/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
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

  function handleDialogClose(open: boolean) {
    setDialogOpen(open);
    if (!open) {
      setInviteEmail("");
      setInviteRole("SALESMAN");
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
            Manage user roles and commission management flags.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Market</TableHead>
                <TableHead className="text-center">Setter Mgr</TableHead>
                <TableHead className="text-center">Territory</TableHead>
                <TableHead className="text-center">VP</TableHead>
                <TableHead className="text-center">NSM</TableHead>
                <TableHead>Territory</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {user.name || "—"}
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
                  <TableCell>{user.market}</TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={user.isSetterManager}
                      onCheckedChange={(v) => toggleRole(user.id, "isSetterManager", v)}
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={user.isTerritoryOwner}
                      onCheckedChange={(v) => toggleRole(user.id, "isTerritoryOwner", v)}
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={user.isVP}
                      onCheckedChange={(v) => toggleRole(user.id, "isVP", v)}
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={user.isNSM}
                      onCheckedChange={(v) => toggleRole(user.id, "isNSM", v)}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      placeholder={user.market}
                      defaultValue={user.territory ?? ""}
                      className="w-[100px] h-8 text-sm"
                      onBlur={(e) => updateTerritory(user.id, e.target.value)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Invitations */}
      <Card>
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
              ) : (
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
              )}
              {!inviteUrl && (
                <DialogFooter>
                  <Button
                    onClick={handleCreateInvite}
                    disabled={creating || !inviteEmail}
                  >
                    {creating && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    Create Invite
                  </Button>
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
      </Card>
    </div>
  );
}
