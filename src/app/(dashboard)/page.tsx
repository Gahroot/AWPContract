"use client";

import { Suspense } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  FilePlus,
  FileText,
  Trophy,
  BarChart,
  Users,
  Book,
  DollarSign,
  Receipt,
  Settings,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface ActionCardProps {
  href: string;
  icon: React.ElementType;
  title: string;
  description?: string;
  disabled?: boolean;
}

function ActionCard({ href, icon: Icon, title, description, disabled }: ActionCardProps) {
  const content = (
    <Card
      className={`group hover:shadow-lg hover:-translate-y-1 transition-all duration-200 ${
        disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
      }`}
    >
      <CardContent className="p-6">
        <div className="flex flex-col items-center text-center gap-4">
          {/* Icon in colored circle - centered at top */}
          <div className="p-4 rounded-full bg-awp-blue/10 text-awp-blue group-hover:bg-awp-blue group-hover:text-white transition-all duration-200">
            <Icon className="h-8 w-8" />
          </div>
          {/* Title below icon */}
          <h3 className="font-semibold text-lg">{title}</h3>
          {/* Description at bottom */}
          {description && (
            <p className="text-sm text-muted-foreground max-w-[200px]">{description}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (disabled) {
    return content;
  }

  return <Link href={href} className="block">{content}</Link>;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function HomePage() {
  return (
    <Suspense fallback={<HomePageSkeleton />}>
      <HomeContent />
    </Suspense>
  );
}

function HomePageSkeleton() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Loading...</h1>
    </div>
  );
}

function HomeContent() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";
  const firstName = session?.user?.name?.split(" ")[0] || "there";

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div>
        <h1 className="text-3xl font-bold">
          {getGreeting()}, {firstName}
        </h1>
        <p className="text-muted-foreground">Welcome back to your dashboard</p>
      </div>

      {/* Quick Actions */}
      <section>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          QUICK ACTIONS
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ActionCard
            href="/contracts/new"
            icon={FilePlus}
            title="Create New Contract"
          />
          <ActionCard
            href="/contracts"
            icon={FileText}
            title="View My Contracts"
          />
          <ActionCard
            href="/advanced-league"
            icon={Trophy}
            title="Advanced League"
            disabled
          />
        </div>
      </section>

      {/* Admin Reports */}
      {isAdmin && (
        <section>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            ADMIN REPORTS
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <ActionCard
              href="/commissions"
              icon={BarChart}
              title="Commission Report"
            />
            <ActionCard
              href="/settings"
              icon={Users}
              title="Manage Users"
            />
            <ActionCard
              href="/settings/pricebook"
              icon={Book}
              title="Pricebook"
              disabled
            />
            <ActionCard
              href="/reports/payroll"
              icon={DollarSign}
              title="Payroll Reports"
              disabled
            />
            <ActionCard
              href="/reports/accounts-receivable"
              icon={Receipt}
              title="Accounts Receivable"
              disabled
            />
            <ActionCard
              href="/reports/overrides"
              icon={FileText}
              title="Override Report"
              disabled
            />
            <ActionCard
              href="/settings/commissions"
              icon={Settings}
              title="Commission Settings"
            />
            <ActionCard
              href="/settings/contract-builder"
              icon={Settings}
              title="Contract Builder Settings"
              disabled
            />
          </div>
        </section>
      )}
    </div>
  );
}
