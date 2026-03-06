"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CommissionTable } from "@/components/commissions/commission-table";
import { CommissionSummaryCard } from "@/components/commissions/commission-summary-card";
import { CommissionCharts } from "@/components/commissions/commission-charts";
import { MonthlySummary } from "@/components/commissions/monthly-summary";
import { RoleWarnings } from "@/components/commissions/role-warnings";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  DollarSign,
  FileText,
  Percent,
  Users,
  Download,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle,
  Banknote,
  FileDown,
  MoreHorizontal,
  RefreshCw,
  Settings,
  MapPin,
  Loader2,
} from "lucide-react";
import Link from "next/link";

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

interface ByStatus {
  status: string;
  totalAmount: number;
  count: number;
}

interface MonthlyTrend {
  month: string;
  total: number;
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

function getStatusAmount(byStatus: ByStatus[], status: string): number {
  return byStatus.find((s) => s.status === status)?.totalAmount ?? 0;
}

function getStatusCount(byStatus: ByStatus[], status: string): number {
  return byStatus.find((s) => s.status === status)?.count ?? 0;
}

function formatDollar(n: number): string {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
}

function CommissionsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session } = useSession();

  const isAdmin = session?.user?.role === "ADMIN";

  const [records, setRecords] = useState<CommissionRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState<Summary>({
    totalCommission: 0,
    totalContracts: 0,
    averageRate: 0,
  });
  const [byUser, setByUser] = useState<ByUser[]>([]);
  const [byRole, setByRole] = useState<ByRole[]>([]);
  const [byStatus, setByStatus] = useState<ByStatus[]>([]);
  const [monthlyTrend, setMonthlyTrend] = useState<MonthlyTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<
    { id: string; name: string | null; email: string }[]
  >([]);

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [recalculating, setRecalculating] = useState(false);

  const page = parseInt(searchParams.get("page") ?? "1");
  const startDate = searchParams.get("startDate") ?? "";
  const endDate = searchParams.get("endDate") ?? "";
  const userId = searchParams.get("userId") ?? "";
  const commissionType = searchParams.get("commissionType") ?? "";
  const status = searchParams.get("status") ?? "";
  const limit = 20;

  // Report tab state
  const [reportStartDate, setReportStartDate] = useState("");
  const [reportEndDate, setReportEndDate] = useState("");
  const [reportUserId, setReportUserId] = useState("");
  const [reportStatus, setReportStatus] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(limit));
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    if (userId) params.set("userId", userId);
    if (commissionType) params.set("commissionType", commissionType);
    if (status) params.set("status", status);

    try {
      const fetches: Promise<Response>[] = [
        fetch(`/api/commissions?${params}`),
      ];
      if (isAdmin) {
        fetches.push(fetch("/api/users/salespeople"));
      }

      const responses = await Promise.all(fetches);
      const commData = await responses[0].json();

      setRecords(commData.records ?? []);
      setTotal(commData.total ?? 0);
      setSummary(
        commData.summary ?? {
          totalCommission: 0,
          totalContracts: 0,
          averageRate: 0,
        }
      );
      setByUser(commData.byUser ?? []);
      setByRole(commData.byRole ?? []);
      setByStatus(commData.byStatus ?? []);
      setMonthlyTrend(commData.monthlyTrend ?? []);

      if (isAdmin && responses[1]?.ok) {
        setUsers(await responses[1].json());
      }
    } finally {
      setLoading(false);
    }
  }, [page, startDate, endDate, userId, commissionType, status, isAdmin]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Clear selection when filters change
  useEffect(() => {
    setSelectedIds(new Set());
  }, [page, startDate, endDate, userId, commissionType, status]);

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
    if (status) params.set("status", status);
    window.open(`/api/commissions/export?${params}`, "_blank");
  }

  async function handleBulkStatus(newStatus: "APPROVED" | "PAID") {
    if (selectedIds.size === 0) return;
    setBulkLoading(true);
    try {
      const res = await fetch("/api/commissions/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedIds), status: newStatus }),
      });
      if (res.ok) {
        const result = await res.json();
        const msg =
          result.updated > 0
            ? `${result.updated} record${result.updated !== 1 ? "s" : ""} updated to ${newStatus}`
            : "No records were updated";
        if (result.skipped > 0) {
          alert(`${msg}. ${result.skipped} skipped (wrong current status).`);
        } else {
          alert(msg);
        }
        setSelectedIds(new Set());
        fetchData();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to update");
      }
    } finally {
      setBulkLoading(false);
    }
  }

  function handleReportExportCsv() {
    const params = new URLSearchParams();
    if (reportStartDate) params.set("startDate", reportStartDate);
    if (reportEndDate) params.set("endDate", reportEndDate);
    if (reportUserId) params.set("userId", reportUserId);
    if (reportStatus) params.set("status", reportStatus);
    window.open(`/api/commissions/export?${params}`, "_blank");
  }

  function handleReportExportPdf() {
    if (!reportStartDate || !reportEndDate) {
      alert("Please select both start and end dates.");
      return;
    }
    const params = new URLSearchParams();
    params.set("startDate", reportStartDate);
    params.set("endDate", reportEndDate);
    if (reportUserId) params.set("userId", reportUserId);
    if (reportStatus) params.set("status", reportStatus);
    window.open(`/api/commissions/report?${params}`, "_blank");
  }

  function setReportPreset(preset: "thisMonth" | "lastMonth" | "thisQuarter") {
    const now = new Date();
    let start: Date;
    let end: Date;

    switch (preset) {
      case "thisMonth":
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case "lastMonth":
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case "thisQuarter": {
        const q = Math.floor(now.getMonth() / 3);
        start = new Date(now.getFullYear(), q * 3, 1);
        end = new Date(now.getFullYear(), q * 3 + 3, 0);
        break;
      }
    }

    setReportStartDate(start.toISOString().split("T")[0]);
    setReportEndDate(end.toISOString().split("T")[0]);
  }

  async function handleRecalculateAll() {
    setRecalculating(true);
    try {
      const res = await fetch("/api/commissions/recalculate", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        alert(`Recalculated ${data.succeeded} of ${data.processed} contracts`);
        fetchData();
      } else {
        alert(data.error ?? "Recalculation failed");
      }
    } finally {
      setRecalculating(false);
    }
  }

  const totalPages = Math.ceil(total / limit);

  // ─── Filter Bar (shared between admin Records tab and salesman Records tab)
  const filterBar = (
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
      {isAdmin && users.length > 0 && (
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
      <div className="space-y-1">
        <Label className="text-xs">Status</Label>
        <Select
          value={status || "all"}
          onValueChange={(v) =>
            updateFilters({ status: v === "all" ? "" : v })
          }
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="APPROVED">Approved</SelectItem>
            <SelectItem value="PAID">Paid</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {(startDate || endDate || userId || commissionType || status) && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            updateFilters({
              startDate: "",
              endDate: "",
              userId: "",
              commissionType: "",
              status: "",
            })
          }
        >
          Clear Filters
        </Button>
      )}
    </div>
  );

  // ─── Pagination
  const pagination = totalPages > 1 && (
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
  );

  // ─── Bulk action bar
  const bulkActionBar = isAdmin && selectedIds.size > 0 && (
    <div className="sticky bottom-4 z-10 flex items-center gap-3 rounded-lg border bg-background p-3 shadow-lg">
      <span className="text-sm font-medium">
        {selectedIds.size} selected
      </span>
      {(!status || status === "PENDING") && (
        <Button
          size="sm"
          variant="outline"
          disabled={bulkLoading}
          onClick={() => handleBulkStatus("APPROVED")}
        >
          <CheckCircle className="h-4 w-4 mr-1" />
          Approve Selected
        </Button>
      )}
      {status === "APPROVED" && (
        <Button
          size="sm"
          variant="outline"
          disabled={bulkLoading}
          onClick={() => handleBulkStatus("PAID")}
        >
          <Banknote className="h-4 w-4 mr-1" />
          Mark as Paid
        </Button>
      )}
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setSelectedIds(new Set())}
      >
        Clear Selection
      </Button>
    </div>
  );

  // ═════════════════════════════════════════════════════════
  // ADMIN VIEW
  // ═════════════════════════════════════════════════════════
  if (isAdmin) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Commissions</h1>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                {recalculating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <MoreHorizontal className="h-4 w-4 mr-2" />
                )}
                Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleRecalculateAll} disabled={recalculating}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Recalculate All
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings/commissions">
                  <Settings className="h-4 w-4 mr-2" />
                  Commission Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings/team">
                  <Users className="h-4 w-4 mr-2" />
                  Team Management
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings/territories">
                  <MapPin className="h-4 w-4 mr-2" />
                  Territories
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <RoleWarnings />

        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="records">Records</TabsTrigger>
            <TabsTrigger value="monthly">Monthly Summary</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          {/* ─── Overview Tab ─── */}
          <TabsContent value="overview" className="space-y-6">
            {/* Summary row 1 */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <CommissionSummaryCard
                title="Total Commission"
                value={formatDollar(summary.totalCommission)}
                icon={DollarSign}
              />
              <CommissionSummaryCard
                title="Pending Amount"
                value={formatDollar(getStatusAmount(byStatus, "PENDING"))}
                description={`${getStatusCount(byStatus, "PENDING")} records`}
                icon={Clock}
              />
              <CommissionSummaryCard
                title="Approved Amount"
                value={formatDollar(getStatusAmount(byStatus, "APPROVED"))}
                description={`${getStatusCount(byStatus, "APPROVED")} records`}
                icon={CheckCircle}
              />
              <CommissionSummaryCard
                title="Paid Amount"
                value={formatDollar(getStatusAmount(byStatus, "PAID"))}
                description={`${getStatusCount(byStatus, "PAID")} records`}
                icon={Banknote}
              />
            </div>

            {/* Summary row 2 */}
            <div className="grid gap-4 md:grid-cols-3">
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
                description={byRole
                  .map(
                    (r) =>
                      ROLE_LABELS[r.commissionType] ?? r.commissionType
                  )
                  .join(", ")}
                icon={Users}
              />
            </div>

            {/* Charts */}
            <CommissionCharts
              monthlyTrend={monthlyTrend}
              byRole={byRole}
              byUser={byUser}
            />
          </TabsContent>

          {/* ─── Records Tab ─── */}
          <TabsContent value="records" className="space-y-4">
            <div className="flex items-center justify-between">
              <div />
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>

            {filterBar}

            {loading ? (
              <div className="py-8 text-center text-muted-foreground">
                Loading...
              </div>
            ) : (
              <CommissionTable
                records={records}
                selectable
                selectedIds={selectedIds}
                onSelectionChange={setSelectedIds}
              />
            )}

            {bulkActionBar}
            {pagination}
          </TabsContent>

          {/* ─── Monthly Summary Tab ─── */}
          <TabsContent value="monthly" className="space-y-4">
            <MonthlySummary
              startDate={startDate || undefined}
              endDate={endDate || undefined}
              userId={userId || undefined}
            />
          </TabsContent>

          {/* ─── Reports Tab ─── */}
          <TabsContent value="reports" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Commission Report</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Period presets */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setReportPreset("thisMonth")}
                  >
                    This Month
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setReportPreset("lastMonth")}
                  >
                    Last Month
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setReportPreset("thisQuarter")}
                  >
                    This Quarter
                  </Button>
                </div>

                {/* Date pickers + filters */}
                <div className="flex flex-wrap gap-4 items-end">
                  <div className="space-y-1">
                    <Label className="text-xs">Start Date</Label>
                    <Input
                      type="date"
                      value={reportStartDate}
                      onChange={(e) => setReportStartDate(e.target.value)}
                      className="w-[160px]"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">End Date</Label>
                    <Input
                      type="date"
                      value={reportEndDate}
                      onChange={(e) => setReportEndDate(e.target.value)}
                      className="w-[160px]"
                    />
                  </div>
                  {users.length > 0 && (
                    <div className="space-y-1">
                      <Label className="text-xs">User</Label>
                      <Select
                        value={reportUserId || "all"}
                        onValueChange={(v) =>
                          setReportUserId(v === "all" ? "" : v)
                        }
                      >
                        <SelectTrigger className="w-[200px]">
                          <SelectValue placeholder="All" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Users</SelectItem>
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
                    <Label className="text-xs">Status</Label>
                    <Select
                      value={reportStatus || "all"}
                      onValueChange={(v) =>
                        setReportStatus(v === "all" ? "" : v)
                      }
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="All" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="PENDING">Pending</SelectItem>
                        <SelectItem value="APPROVED">Approved</SelectItem>
                        <SelectItem value="PAID">Paid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Export buttons */}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={handleReportExportCsv}
                    disabled={!reportStartDate && !reportEndDate}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                  <Button
                    onClick={handleReportExportPdf}
                    disabled={!reportStartDate || !reportEndDate}
                  >
                    <FileDown className="h-4 w-4 mr-2" />
                    Export PDF
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  // ═════════════════════════════════════════════════════════
  // SALESMAN VIEW
  // ═════════════════════════════════════════════════════════
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My Commissions</h1>

      <Tabs defaultValue="earnings">
        <TabsList>
          <TabsTrigger value="earnings">My Earnings</TabsTrigger>
          <TabsTrigger value="records">Records</TabsTrigger>
        </TabsList>

        {/* ─── My Earnings Tab ─── */}
        <TabsContent value="earnings" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <CommissionSummaryCard
              title="Pending"
              value={formatDollar(getStatusAmount(byStatus, "PENDING"))}
              description={`${getStatusCount(byStatus, "PENDING")} records`}
              icon={Clock}
            />
            <CommissionSummaryCard
              title="Approved"
              value={formatDollar(getStatusAmount(byStatus, "APPROVED"))}
              description={`${getStatusCount(byStatus, "APPROVED")} records`}
              icon={CheckCircle}
            />
            <CommissionSummaryCard
              title="Paid"
              value={formatDollar(getStatusAmount(byStatus, "PAID"))}
              description={`${getStatusCount(byStatus, "PAID")} records`}
              icon={Banknote}
            />
          </div>

          {/* Simple trend chart */}
          {monthlyTrend.length > 0 && (
            <CommissionCharts
              monthlyTrend={monthlyTrend}
              byRole={byRole}
              byUser={byUser}
            />
          )}
        </TabsContent>

        {/* ─── Records Tab ─── */}
        <TabsContent value="records" className="space-y-4">
          {filterBar}

          {loading ? (
            <div className="py-8 text-center text-muted-foreground">
              Loading...
            </div>
          ) : (
            <CommissionTable records={records} />
          )}

          {pagination}
        </TabsContent>
      </Tabs>
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
