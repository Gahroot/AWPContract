"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { SalesContractForm } from "@/components/contracts/sales-contract-form";
import { Skeleton } from "@/components/ui/skeleton";

export default function EditContractPage() {
  const params = useParams();
  const id = params.id as string;
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/contracts/${id}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
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

  return <SalesContractForm initialData={data} contractId={id} />;
}
