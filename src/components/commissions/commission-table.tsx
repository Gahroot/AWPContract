"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface CommissionRecordRow {
  id: string;
  contractTotal: number;
  fairPrice: number;
  commissionType: string;
  isBelowFair: boolean;
  isSelfGen: boolean;
  tierLabel: string | null;
  rate: number;
  amount: number;
  createdAt: string;
  contract: {
    contractNumber: string;
    customerName: string | null;
  };
  user: {
    id: string;
    name: string | null;
    email: string;
  };
}

interface CommissionTableProps {
  records: CommissionRecordRow[];
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

export function CommissionTable({ records }: CommissionTableProps) {
  if (records.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        No commission records found.
      </p>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Contract #</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Recipient</TableHead>
            <TableHead>Role</TableHead>
            <TableHead className="text-right">Contract Total</TableHead>
            <TableHead className="text-right">Fair Price</TableHead>
            <TableHead>Flags</TableHead>
            <TableHead className="text-right">Rate</TableHead>
            <TableHead className="text-right">Commission</TableHead>
            <TableHead>Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="font-mono text-sm">
                {r.contract.contractNumber.slice(0, 8)}
              </TableCell>
              <TableCell>{r.contract.customerName ?? "-"}</TableCell>
              <TableCell>{r.user.name ?? r.user.email}</TableCell>
              <TableCell>
                <Badge variant="outline" className="text-xs">
                  {formatRole(r.commissionType)}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                {formatCurrency(r.contractTotal)}
              </TableCell>
              <TableCell className="text-right">
                {formatCurrency(r.fairPrice)}
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
              <TableCell className="text-right font-medium">
                {formatCurrency(r.amount)}
              </TableCell>
              <TableCell>
                {new Date(r.createdAt).toLocaleDateString()}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
