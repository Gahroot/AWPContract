"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface CommissionRecordRow {
  id: string;
  contractTotal: number;
  modelType: string;
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

function formatModelType(type: string): string {
  switch (type) {
    case "FLAT_PERCENT":
      return "Flat %";
    case "PER_SALESPERSON":
      return "Per-SP";
    case "TIERED":
      return "Tiered";
    default:
      return type;
  }
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
            <TableHead>Salesperson</TableHead>
            <TableHead className="text-right">Contract Total</TableHead>
            <TableHead>Model</TableHead>
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
              <TableCell className="text-right">
                {formatCurrency(r.contractTotal)}
              </TableCell>
              <TableCell>{formatModelType(r.modelType)}</TableCell>
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
