"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface CommissionRecord {
  id: string;
  commissionType: string;
  rate: number;
  amount: number;
  isBelowFair: boolean;
  isSelfGen: boolean;
  tierLabel: string | null;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
}

interface ContractCommissionsCardProps {
  records: CommissionRecord[];
  contractId: string;
  isAdmin: boolean;
  onRecalculated: (records: CommissionRecord[]) => void;
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(n);
}

function formatRole(type: string): string {
  const labels: Record<string, string> = {
    SALES_REP: "Sales Rep",
    SETTER: "Setter",
    SETTER_MANAGER: "Setter Mgr",
    TERRITORY_OWNER: "Territory",
    VP: "VP",
    NSM: "NSM",
  };
  return labels[type] ?? type;
}

export function ContractCommissionsCard({
  records,
  contractId,
  isAdmin,
  onRecalculated,
}: ContractCommissionsCardProps) {
  const [recalculating, setRecalculating] = useState(false);

  const total = records.reduce((sum, r) => sum + r.amount, 0);

  async function handleRecalculate() {
    setRecalculating(true);
    try {
      const res = await fetch(`/api/commissions/recalculate/${contractId}`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to recalculate");
      }
      const updated = await res.json();
      onRecalculated(updated);
      toast.success("Commissions recalculated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Recalculation failed");
    } finally {
      setRecalculating(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Commissions</CardTitle>
        {isAdmin && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleRecalculate}
            disabled={recalculating}
          >
            {recalculating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Recalculate
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Recipient</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Flags</TableHead>
                <TableHead className="text-right">Rate</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">
                    {r.user.name ?? r.user.email}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {formatRole(r.commissionType)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {r.isBelowFair && (
                        <Badge variant="destructive" className="text-xs">
                          Below Fair
                        </Badge>
                      )}
                      {r.isSelfGen && (
                        <Badge variant="secondary" className="text-xs">
                          Self-Gen
                        </Badge>
                      )}
                      {r.tierLabel && (
                        <Badge variant="outline" className="text-xs">
                          {r.tierLabel}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {(r.rate * 100).toFixed(2)}%
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(r.amount)}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="font-semibold">
                <TableCell colSpan={4} className="text-right">
                  Total
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(total)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
