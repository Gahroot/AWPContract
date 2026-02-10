"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CommissionTable } from "@/components/commissions/commission-table";
import { CommissionSummaryCard } from "@/components/commissions/commission-summary-card";
import {
  DollarSign,
  FileText,
  Percent,
  Settings,
  Download,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface Summary {
  totalCommission: number;
  totalContracts: number;
  averageRate: number;
}

interface ByUser {
  userId: string;
  name: string;
  totalCommission: number;
  contractCount: number;
}

interface CommissionRecord {
  id: string;
  contractTotal: number;
  modelType: string;
  rate: number;
  amount: number;
  createdAt: string;
  contract: { contractNumber: string; customerName: string | null };
  user: { id: string; name: string | null; email: string };
}

function CommissionsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [records, setRecords] = useState<CommissionRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState<Summary>({
    totalCommission: 0,
    totalContracts: 0,
    averageRate: 0,
  });
  const [byUser, setByUser] = useState<ByUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<{ id: string; name: string | null; email: string }[]>([]);
  const [activeModel, setActiveModel] = useState("FLAT_PERCENT");

  // Filter state from URL
  const page = parseInt(searchParams.get("page") ?? "1");
  const startDate = searchParams.get("startDate") ?? "";
  const endDate = searchParams.get("endDate") ?? "";
  const userId = searchParams.get("userId") ?? "";
  const limit = 20;

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(limit));
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    if (userId) params.set("userId", userId);

    try {
      const [commRes, configRes] = await Promise.all([
        fetch(`/api/commissions?${params}`),
        fetch("/api/commissions/config"),
      ]);
      const commData = await commRes.json();
      const configData = await configRes.json();

      setRecords(commData.records ?? []);
      setTotal(commData.total ?? 0);
      setSummary(commData.summary ?? { totalCommission: 0, totalContracts: 0, averageRate: 0 });
      setByUser(commData.byUser ?? []);
      setActiveModel(configData.config?.modelType ?? "FLAT_PERCENT");

      // Get unique users from salesperson rates for filter dropdown
      const rateUsers = (configData.salespersonRates ?? []).map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (r: any) => r.user ?? { id: r.userId, name: null, email: "" }
      );
      setUsers(rateUsers);
    } finally {
      setLoading(false);
    }
  }, [page, startDate, endDate, userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function updateFilters(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    }
    // Reset to page 1 on filter change
    if (!updates.page) params.set("page", "1");
    router.push(`/commissions?${params.toString()}`);
  }

  function handleExport() {
    const params = new URLSearchParams();
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    if (userId) params.set("userId", userId);
    window.open(`/api/commissions/export?${params}`, "_blank");
  }

  const totalPages = Math.ceil(total / limit);
  const modelLabel =
    activeModel === "FLAT_PERCENT"
      ? "Flat %"
      : activeModel === "PER_SALESPERSON"
        ? "Per-Salesperson"
        : "Tiered";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Commissions</h1>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <CommissionSummaryCard
          title="Total Commission"
          value={`$${summary.totalCommission.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
          icon={DollarSign}
        />
        <CommissionSummaryCard
          title="Total Contracts"
          value={String(summary.totalContracts)}
          icon={FileText}
        />
        <CommissionSummaryCard
          title="Average Rate"
          value={`${(summary.averageRate * 100).toFixed(2)}%`}
          icon={Percent}
        />
        <CommissionSummaryCard
          title="Active Model"
          value={modelLabel}
          icon={Settings}
        />
      </div>

      {/* Per-salesperson breakdown */}
      {byUser.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {byUser.map((u) => (
            <Card key={u.userId}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">{u.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">
                  ${u.totalCommission.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-muted-foreground">
                  {u.contractCount} contract{u.contractCount !== 1 ? "s" : ""}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-end">
        <div className="space-y-1">
          <Label className="text-xs">Start Date</Label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => updateFilters({ startDate: e.target.value })}
            className="w-[160px]"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">End Date</Label>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => updateFilters({ endDate: e.target.value })}
            className="w-[160px]"
          />
        </div>
        {users.length > 0 && (
          <div className="space-y-1">
            <Label className="text-xs">Salesperson</Label>
            <Select
              value={userId || "all"}
              onValueChange={(v) =>
                updateFilters({ userId: v === "all" ? "" : v })
              }
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Salespeople</SelectItem>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name || u.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        {(startDate || endDate || userId) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              updateFilters({ startDate: "", endDate: "", userId: "" })
            }
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Records table */}
      {loading ? (
        <div className="py-8 text-center text-muted-foreground">Loading...</div>
      ) : (
        <CommissionTable records={records} />
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * limit + 1}-{Math.min(page * limit, total)} of{" "}
            {total}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => updateFilters({ page: String(page - 1) })}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => updateFilters({ page: String(page + 1) })}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CommissionsPage() {
  return (
    <Suspense>
      <CommissionsContent />
    </Suspense>
  );
}
