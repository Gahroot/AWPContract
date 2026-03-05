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
  Users,
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

interface ByRole {
  commissionType: string;
  totalCommission: number;
  count: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CommissionRecord = any;

const ROLE_LABELS: Record<string, string> = {
  SALES_REP: "Sales Rep",
  SETTER: "Setter",
  SETTER_MANAGER: "Setter Mgr",
  TERRITORY_OWNER: "Territory",
  VP: "VP",
  NSM: "NSM",
};

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
  const [byRole, setByRole] = useState<ByRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<{ id: string; name: string | null; email: string }[]>([]);

  const page = parseInt(searchParams.get("page") ?? "1");
  const startDate = searchParams.get("startDate") ?? "";
  const endDate = searchParams.get("endDate") ?? "";
  const userId = searchParams.get("userId") ?? "";
  const commissionType = searchParams.get("commissionType") ?? "";
  const limit = 20;

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(limit));
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    if (userId) params.set("userId", userId);
    if (commissionType) params.set("commissionType", commissionType);

    try {
      const [commRes, usersRes] = await Promise.all([
        fetch(`/api/commissions?${params}`),
        fetch("/api/users/salespeople"),
      ]);
      const commData = await commRes.json();

      setRecords(commData.records ?? []);
      setTotal(commData.total ?? 0);
      setSummary(commData.summary ?? { totalCommission: 0, totalContracts: 0, averageRate: 0 });
      setByUser(commData.byUser ?? []);
      setByRole(commData.byRole ?? []);

      if (usersRes.ok) {
        setUsers(await usersRes.json());
      }
    } finally {
      setLoading(false);
    }
  }, [page, startDate, endDate, userId, commissionType]);

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
          title="Total Records"
          value={String(summary.totalContracts)}
          icon={FileText}
        />
        <CommissionSummaryCard
          title="Average Rate"
          value={`${(summary.averageRate * 100).toFixed(2)}%`}
          icon={Percent}
        />
        <CommissionSummaryCard
          title="Roles Active"
          value={String(byRole.length)}
          description={byRole.map(r => ROLE_LABELS[r.commissionType] ?? r.commissionType).join(", ")}
          icon={Users}
        />
      </div>

      {/* By-role breakdown */}
      {byRole.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          {byRole.map((r) => (
            <Card key={r.commissionType}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  {ROLE_LABELS[r.commissionType] ?? r.commissionType}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold">
                  ${r.totalCommission.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-muted-foreground">
                  {r.count} record{r.count !== 1 ? "s" : ""}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Per-user breakdown */}
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
                  {u.contractCount} record{u.contractCount !== 1 ? "s" : ""}
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
            <Label className="text-xs">Recipient</Label>
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
                <SelectItem value="all">All Recipients</SelectItem>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name || u.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="space-y-1">
          <Label className="text-xs">Role</Label>
          <Select
            value={commissionType || "all"}
            onValueChange={(v) =>
              updateFilters({ commissionType: v === "all" ? "" : v })
            }
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              {Object.entries(ROLE_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {(startDate || endDate || userId || commissionType) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              updateFilters({ startDate: "", endDate: "", userId: "", commissionType: "" })
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
