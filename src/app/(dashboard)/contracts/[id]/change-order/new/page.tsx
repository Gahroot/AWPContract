"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ChangeOrderForm } from "@/components/contracts/change-order-form";
import { Skeleton } from "@/components/ui/skeleton";

export default function NewChangeOrderPage() {
  const params = useParams();
  const id = params.id as string;
  const [contract, setContract] = useState<{
    id: string;
    contractNumber: string;
    customerName: string | null;
    contractTotal: number;
    downPayment: number;
    balanceDue: number;
    error?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/contracts/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load");
        return r.json();
      })
      .then(setContract)
      .catch(() => setError("Something went wrong. Please try again."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-32 w-full" />
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

  if (!contract || contract.error) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Contract not found
      </div>
    );
  }

  return <ChangeOrderForm contract={contract} />;
}
