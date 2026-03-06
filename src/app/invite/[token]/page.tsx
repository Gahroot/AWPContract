"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
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
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";

interface InviteDetails {
  email: string;
  role: string;
  market: string;
  inviterName: string | null;
}

export default function AcceptInvitePage() {
  const { token } = useParams<{ token: string }>();
  const [invite, setInvite] = useState<InviteDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch(`/api/invites/accept/${token}`)
      .then(async (res) => {
        if (res.ok) {
          setInvite(await res.json());
        } else {
          const data = await res.json();
          setError(data.error || "Invalid invite link");
        }
      })
      .catch(() => setError("Failed to load invite"))
      .finally(() => setLoading(false));
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormErrors({});

    const errors: Record<string, string> = {};
    if (!name.trim()) errors.name = "Name is required";
    if (password.length < 12)
      errors.password = "Password must be at least 12 characters";
    else if (!/[A-Z]/.test(password))
      errors.password = "Password must contain at least one uppercase letter";
    else if (!/[a-z]/.test(password))
      errors.password = "Password must contain at least one lowercase letter";
    else if (!/[0-9]/.test(password))
      errors.password = "Password must contain at least one number";
    else if (!/[^A-Za-z0-9]/.test(password))
      errors.password = "Password must contain at least one special character";
    if (password !== confirmPassword)
      errors.confirmPassword = "Passwords do not match";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/invites/accept/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, password, confirmPassword }),
      });

      if (res.ok) {
        setSuccess(true);
      } else {
        const data = await res.json();
        if (data.details?.fieldErrors) {
          const fieldErrors: Record<string, string> = {};
          for (const [key, msgs] of Object.entries(data.details.fieldErrors)) {
            fieldErrors[key] = (msgs as string[])[0];
          }
          setFormErrors(fieldErrors);
        } else {
          setFormErrors({ _form: data.error || "Failed to create account" });
        }
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto" />
            <h2 className="text-xl font-semibold">Account Created</h2>
            <p className="text-muted-foreground">
              Your account has been set up successfully. You can now log in.
            </p>
            <Link href="/login">
              <Button className="w-full">Go to Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <XCircle className="h-12 w-12 text-destructive mx-auto" />
            <h2 className="text-xl font-semibold">Invalid Invite</h2>
            <p className="text-muted-foreground">{error}</p>
            <Link href="/login">
              <Button variant="outline">Go to Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create Your Account</CardTitle>
          <CardDescription>
            You&apos;ve been invited to join AWP Contracts
            {invite?.inviterName ? ` by ${invite.inviterName}` : ""}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-6">
            <Badge variant="secondary">{invite?.role}</Badge>
            <Badge variant="outline">{invite?.market}</Badge>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={invite?.email ?? ""} disabled />
            </div>

            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
              />
              {formErrors.name && (
                <p className="text-sm text-destructive">{formErrors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Password</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 12 characters"
              />
              {formErrors.password && (
                <p className="text-sm text-destructive">
                  {formErrors.password}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Confirm Password</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              {formErrors.confirmPassword && (
                <p className="text-sm text-destructive">
                  {formErrors.confirmPassword}
                </p>
              )}
            </div>

            {formErrors._form && (
              <p className="text-sm text-destructive">{formErrors._form}</p>
            )}

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Create Account
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
