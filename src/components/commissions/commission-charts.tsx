"use client";

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MonthlyTrendItem {
  month: string;
  total: number;
}

interface ByRoleItem {
  commissionType: string;
  totalCommission: number;
  count: number;
}

interface ByUserItem {
  userId: string;
  name: string;
  totalCommission: number;
  contractCount: number;
}

interface CommissionChartsProps {
  monthlyTrend: MonthlyTrendItem[];
  byRole: ByRoleItem[];
  byUser: ByUserItem[];
}

const ROLE_LABELS: Record<string, string> = {
  SALES_REP: "Sales Rep",
  SETTER: "Setter",
  SETTER_MANAGER: "Setter Mgr",
  TERRITORY_OWNER: "Territory",
  VP: "VP",
  NSM: "NSM",
};

function formatDollar(value: number) {
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function DollarTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-background px-3 py-2 shadow-sm text-sm">
      <p className="font-medium">{label}</p>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {payload.map((entry: any, i: number) => (
        <p key={i} style={{ color: entry.color }}>
          {formatDollar(entry.value)}
        </p>
      ))}
    </div>
  );
}

export function CommissionCharts({
  monthlyTrend,
  byRole,
  byUser,
}: CommissionChartsProps) {
  const roleData = byRole.map((r) => ({
    name: ROLE_LABELS[r.commissionType] ?? r.commissionType,
    total: r.totalCommission,
  }));

  const userData = [...byUser]
    .sort((a, b) => b.totalCommission - a.totalCommission)
    .slice(0, 10)
    .map((u) => ({
      name: u.name.length > 15 ? u.name.slice(0, 14) + "..." : u.name,
      total: u.totalCommission,
    }));

  const trendData = monthlyTrend.map((m) => ({
    month: m.month.slice(5), // "MM" from "YYYY-MM"
    total: m.total,
  }));

  return (
    <Tabs defaultValue="trend">
      <TabsList>
        <TabsTrigger value="trend">Monthly Trend</TabsTrigger>
        <TabsTrigger value="role">By Role</TabsTrigger>
        <TabsTrigger value="user">Top Earners</TabsTrigger>
      </TabsList>

      <TabsContent value="trend">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Commission Totals (Last 12 Months)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {trendData.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No trend data available.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis tickFormatter={formatDollar} className="text-xs" />
                  <Tooltip content={<DollarTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="role">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Total Commission by Role
            </CardTitle>
          </CardHeader>
          <CardContent>
            {roleData.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No role data available.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={roleData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis tickFormatter={formatDollar} className="text-xs" />
                  <Tooltip content={<DollarTooltip />} />
                  <Bar
                    dataKey="total"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="user">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Top 10 Earners
            </CardTitle>
          </CardHeader>
          <CardContent>
            {userData.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No user data available.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={userData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" tickFormatter={formatDollar} className="text-xs" />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={120}
                    className="text-xs"
                  />
                  <Tooltip content={<DollarTooltip />} />
                  <Bar
                    dataKey="total"
                    fill="hsl(var(--primary))"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
