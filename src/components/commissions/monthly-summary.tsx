"use client";

import { useEffect, useState } from "react";
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
import { Loader2 } from "lucide-react";

interface MonthlyBreakdown {
  month: string;
  total: number;
  count: number;
  avgRate: number;
}

interface MonthlySummaryProps {
  startDate?: string;
  endDate?: string;
  userId?: string;
}

export function MonthlySummary({ startDate, endDate, userId }: MonthlySummaryProps) {
  const [data, setData] = useState<MonthlyBreakdown[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("groupBy", "month");
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      if (userId) params.set("userId", userId);

      try {
        const res = await fetch(`/api/commissions?${params}`);
        if (res.ok) {
          const json = await res.json();
          setData(json.monthlyBreakdown ?? []);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [startDate, endDate, userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const maxTotal = Math.max(...data.map((d) => d.total), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Commission Summary</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No commission data for the selected period.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Records</TableHead>
                <TableHead className="text-right">Avg Rate</TableHead>
                <TableHead className="w-[200px]">Distribution</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row) => (
                <TableRow key={row.month}>
                  <TableCell className="font-medium">{row.month}</TableCell>
                  <TableCell className="text-right">
                    ${row.total.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-right">{row.count}</TableCell>
                  <TableCell className="text-right">
                    {(row.avgRate * 100).toFixed(2)}%
                  </TableCell>
                  <TableCell>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary rounded-full h-2 transition-all"
                        style={{ width: `${(row.total / maxTotal) * 100}%` }}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
