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
import { Checkbox } from "@/components/ui/checkbox";

export interface CommissionRecordRow {
  id: string;
  contractTotal: number;
  fairPrice: number;
  commissionType: string;
  isBelowFair: boolean;
  isSelfGen: boolean;
  tierLabel: string | null;
  rate: number;
  amount: number;
  status: string;
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
  selectable?: boolean;
  selectedIds?: Set<string>;
  onSelectionChange?: (ids: Set<string>) => void;
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

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "PENDING":
      return (
        <Badge variant="outline" className="text-xs border-amber-400 text-amber-600">
          Pending
        </Badge>
      );
    case "APPROVED":
      return (
        <Badge variant="secondary" className="text-xs">
          Approved
        </Badge>
      );
    case "PAID":
      return (
        <Badge variant="default" className="text-xs bg-green-600">
          Paid
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="text-xs">
          {status}
        </Badge>
      );
  }
}

export function CommissionTable({
  records,
  selectable = false,
  selectedIds,
  onSelectionChange,
}: CommissionTableProps) {
  if (records.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        No commission records found.
      </p>
    );
  }

  const allSelected =
    selectable && selectedIds && records.every((r) => selectedIds.has(r.id));
  const someSelected =
    selectable &&
    selectedIds &&
    records.some((r) => selectedIds.has(r.id)) &&
    !allSelected;

  function toggleAll() {
    if (!onSelectionChange) return;
    if (allSelected) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(records.map((r) => r.id)));
    }
  }

  function toggleOne(id: string) {
    if (!onSelectionChange || !selectedIds) return;
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    onSelectionChange(next);
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {selectable && (
              <TableHead className="w-[40px]">
                <Checkbox
                  checked={allSelected ? true : someSelected ? "indeterminate" : false}
                  onCheckedChange={toggleAll}
                  aria-label="Select all"
                />
              </TableHead>
            )}
            <TableHead>Contract #</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Recipient</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
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
              {selectable && (
                <TableCell>
                  <Checkbox
                    checked={selectedIds?.has(r.id) ?? false}
                    onCheckedChange={() => toggleOne(r.id)}
                    aria-label={`Select ${r.contract.contractNumber}`}
                  />
                </TableCell>
              )}
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
              <TableCell>
                <StatusBadge status={r.status} />
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
