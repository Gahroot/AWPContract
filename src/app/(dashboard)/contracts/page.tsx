"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  FileText,
  FilePlus,
  Clock,
  CheckCircle,
  Edit,
  ChevronLeft,
  ChevronRight,
  Search,
  MoreHorizontal,
  FileSignature,
  FileDiff,
  Download,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { ContractStatusBadge } from "@/components/contracts/contract-status-badge";
import { HubSpotSyncBadge } from "@/components/contracts/hubspot-sync-badge";
import { formatCurrency } from "@/lib/pricing";
import { toast } from "sonner";
import { CONTRACT_STATUSES } from "@/lib/constants";
import { format } from "date-fns";

interface ContractListItem {
  id: string;
  contractNumber: string;
  customerName: string | null;
  jobAddress: string | null;
  contractTotal: number;
  status: string;
  createdAt: string;
  hubspotSyncStatus: string | null;
  hubspotLastSynced: string | null;
  hubspotSyncError: string | null;
}

interface DashboardData {
  contracts: ContractListItem[];
  total: number;
  stats: {
    inHubSpot: number;
    pendingHubSpot: number;
    totalWonValue: number;
    totalUnits: number;
    commissionable: number;
  };
}

export default function ContractsPage() {
  return (
    <Suspense>
      <ContractsContent />
    </Suspense>
  );
}

function ContractsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [syncingContractId, setSyncingContractId] = useState<string | null>(null);

  const statusFilter = searchParams.get("status") || "all";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = 10;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (search) params.set("search", search);
      params.set("page", String(page));
      params.set("limit", String(limit));

      const res = await fetch(`/api/contracts?${params}`);
      if (res.ok) {
        setData(await res.json());
      }
    } catch {
      toast.error("Failed to load contracts");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function updateParams(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([k, v]) => {
      if (v) params.set(k, v);
      else params.delete(k);
    });
    router.push(`/contracts?${params}`);
  }

  async function handleSyncToHubSpot(contractId: string, contractNumber: string) {
    setSyncingContractId(contractId);
    try {
      const res = await fetch("/api/hubspot/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contractId })
      });

      if (res.ok) {
        toast.success(`Contract ${contractNumber.slice(0, 8)}... synced to HubSpot`);
        fetchData();
      } else {
        const { error } = await res.json();
        toast.error(error || "Sync failed");
      }
    } catch {
      toast.error("Network error during HubSpot sync");
    } finally {
      setSyncingContractId(null);
    }
  }

  const totalPages = data ? Math.ceil(data.total / limit) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">My Contracts</h1>
          <p className="text-muted-foreground">Manage your deals and quotes</p>
        </div>
        <Button asChild>
          <Link href="/contracts/new">
            <FilePlus className="h-4 w-4 mr-2" />
            New Contract
          </Link>
        </Button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 text-green-700">
                <CheckCircle className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">In HubSpot</p>
                <div className="text-lg font-semibold">
                  {loading ? (
                    <Skeleton className="h-6 w-8" />
                  ) : (
                    data?.stats.inHubSpot ?? 0
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100 text-amber-700">
                <Clock className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pending HubSpot</p>
                <div className="text-lg font-semibold">
                  {loading ? (
                    <Skeleton className="h-6 w-8" />
                  ) : (
                    data?.stats.pendingHubSpot ?? 0
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
                <FileText className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Won Value</p>
                <div className="text-lg font-semibold">
                  {loading ? (
                    <Skeleton className="h-6 w-16" />
                  ) : (
                    formatCurrency(data?.stats.totalWonValue ?? 0)
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100 text-purple-700">
                <FileText className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Units</p>
                <div className="text-lg font-semibold">
                  {loading ? (
                    <Skeleton className="h-6 w-8" />
                  ) : (
                    data?.stats.totalUnits ?? 0
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-teal-100 text-teal-700">
                <CheckCircle className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Commissionable</p>
                <div className="text-lg font-semibold">
                  {loading ? (
                    <Skeleton className="h-6 w-8" />
                  ) : (
                    data?.stats.commissionable ?? 0
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contracts table */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
            <Tabs
              value={statusFilter}
              onValueChange={(v) =>
                updateParams({ status: v === "all" ? "" : v, page: "" })
              }
            >
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="DRAFT">Drafts</TabsTrigger>
                <TabsTrigger value="PENDING_SIGNATURE">Pending</TabsTrigger>
                <TabsTrigger value="COMPLETED">Completed</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <Input
                placeholder="Search contracts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    updateParams({ search, page: "" });
                  }
                }}
                className="pl-9"
              />
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contract #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="hidden md:table-cell">Address</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden sm:table-cell">HubSpot</TableHead>
                <TableHead className="hidden sm:table-cell">Date</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-5 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : data?.contracts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No contracts found
                  </TableCell>
                </TableRow>
              ) : (
                data?.contracts.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/contracts/${c.id}/edit`}
                        className="text-awp-blue hover:underline"
                      >
                        {c.contractNumber.slice(0, 8)}...
                      </Link>
                    </TableCell>
                    <TableCell>{c.customerName || "—"}</TableCell>
                    <TableCell className="hidden md:table-cell max-w-[200px] truncate">
                      {c.jobAddress || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(c.contractTotal)}
                    </TableCell>
                    <TableCell>
                      <ContractStatusBadge status={c.status as keyof typeof CONTRACT_STATUSES} />
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <HubSpotSyncBadge
                        status={c.hubspotSyncStatus}
                        lastSynced={c.hubspotLastSynced}
                        error={c.hubspotSyncError}
                      />
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">
                      {format(new Date(c.createdAt), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Contract options">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/contracts/${c.id}/edit`}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/contracts/${c.id}/addendum/new`}>
                              <FileSignature className="h-4 w-4 mr-2" />
                              New Addendum
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/contracts/${c.id}/change-order/new`}>
                              <FileDiff className="h-4 w-4 mr-2" />
                              New Change Order
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleSyncToHubSpot(c.id, c.contractNumber)}
                            disabled={syncingContractId === c.id}
                          >
                            <RefreshCw className={`h-4 w-4 mr-2 ${syncingContractId === c.id ? "animate-spin" : ""}`} />
                            Sync to HubSpot
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={async () => {
                              try {
                                const res = await fetch(`/api/contracts/${c.id}/pdf`);
                                if (res.ok) {
                                  const { url } = await res.json();
                                  window.open(url, "_blank");
                                } else {
                                  console.error("PDF generation failed");
                                }
                              } catch (e) {
                                console.error("PDF generation error:", e);
                                toast.error("Failed to generate PDF");
                              }
                            }}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Export PDF
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => updateParams({ page: String(page - 1) })}
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => updateParams({ page: String(page + 1) })}
                  aria-label="Next page"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
