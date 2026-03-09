"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { SalesContractForm } from "@/components/contracts/sales-contract-form";
import { ContractCommissionsCard } from "@/components/commissions/contract-commissions-card";
import { Skeleton } from "@/components/ui/skeleton";

interface SessionUser {
  role?: string;
}

export default function EditContractPage() {
  const params = useParams();
  const id = params.id as string;
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);

  const fetchContract = useCallback(() => {
    return fetch(`/api/contracts/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load");
        return r.json();
      })
      .then(setData)
      .catch(() => setError("Something went wrong. Please try again."));
  }, [id]);

  useEffect(() => {
    fetchContract().finally(() => setLoading(false));
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((s) => setSessionUser(s?.user ?? null))
      .catch((e) => console.error("Failed to load session:", e));
  }, [fetchContract]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        {error}
      </div>
    );
  }

  if (!data || data.error) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Contract not found
      </div>
    );
  }

  const commissionRecords = (data.commissionRecords ?? []) as Array<{
    id: string;
    commissionType: string;
    rate: number;
    amount: number;
    isBelowFair: boolean;
    isSelfGen: boolean;
    tierLabel: string | null;
    user: { id: string; name: string | null; email: string };
  }>;
  const isAdmin = sessionUser?.role === "ADMIN";
  const showCommissions =
    data.status === "COMPLETED" && commissionRecords.length > 0;

  return (
    <div className="space-y-6">
      <SalesContractForm initialData={data} contractId={id} />
      {showCommissions && (
        <ContractCommissionsCard
          records={commissionRecords}
          contractId={id}
          isAdmin={isAdmin}
          onRecalculated={(updated) =>
            setData((prev) =>
              prev ? { ...prev, commissionRecords: updated } : prev
            )
          }
        />
      )}
    </div>
  );
}
