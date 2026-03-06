"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  Home,
  FileText,
  BarChart,
  Trophy,
  Key,
  Users,
  Settings as SettingsIcon,
  ChevronDown,
  ChevronUp,
  Menu,
  LogOut,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { motion } from "motion/react";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/contracts", label: "Contracts", icon: FileText },
  { href: "/commissions", label: "Commission Report", icon: BarChart },
  { href: "/advanced-league", label: "Advanced League", icon: Trophy },
  { href: "/settings", label: "Settings", icon: SettingsIcon },
];

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const [adminExpanded, setAdminExpanded] = useState(false);
  const { data: session } = useSession();

  const adminItems = [
    { href: "/settings", label: "Manage Users", icon: Users },
    { href: "/commissions/settings", label: "Commission Settings", icon: SettingsIcon },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="p-4">
        <Image src="/logo.png" alt="AWP" width={160} height={48} preload />
      </div>
      <Separator />
      <nav className="flex-1 p-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href) && pathname !== "/";
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "relative flex items-center gap-3 px-3 py-2 rounded-r-md text-sm font-medium transition-colors",
                isActive
                  ? "text-white"
                  : "text-white/70 hover:bg-white/5 hover:text-white"
              )}
            >
              {/* Orange vertical bar on left edge for active state */}
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1.5 rounded-r-full bg-awp-orange" />
              )}
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}

        {/* Admin Section */}
        {session?.user?.role === "ADMIN" && (
          <div className="mt-4">
            <button
              onClick={() => setAdminExpanded(!adminExpanded)}
              className={cn(
                "flex items-center justify-between w-full gap-3 px-3 py-2 rounded-r-md text-sm font-medium transition-colors",
                "text-white/70 hover:bg-white/5 hover:text-white"
              )}
            >
              <div className="flex items-center gap-3">
                <Key className="h-4 w-4" />
                <span>Admin</span>
              </div>
              {adminExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
            <motion.div
              initial={false}
              animate={{
                height: adminExpanded ? "auto" : 0,
                opacity: adminExpanded ? 1 : 0,
              }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="space-y-1 mt-1 ml-4">
                {adminItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onNavigate}
                      className={cn(
                        "relative flex items-center gap-3 px-3 py-2 rounded-r-md text-sm font-medium transition-colors",
                        isActive
                          ? "text-white"
                          : "text-white/70 hover:bg-white/5 hover:text-white"
                      )}
                    >
                      {/* Orange vertical bar on left edge for active state */}
                      {isActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1.5 rounded-r-full bg-awp-orange" />
                      )}
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </nav>

      {/* User Info at Bottom */}
      <Separator />
      <div className="p-4">
        <div className="text-sm font-medium text-white">{session?.user?.name || "User"}</div>
        <div className="text-xs text-white/70">
          {session?.user?.role === "ADMIN" ? "Admin" : "Salesman"}
        </div>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <div className="min-h-screen flex">
      {/* Desktop sidebar - hidden on mobile and tablet */}
      <aside className="hidden 2xl:flex 2xl:w-64 2xl:flex-col border-r" style={{ backgroundColor: 'var(--sidebar)' }}>
        <Sidebar />
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="flex items-center justify-between h-14 border-b px-4 bg-background">
          <div className="flex items-center gap-2">
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="2xl:hidden" aria-label="Open navigation menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64" style={{ backgroundColor: 'var(--sidebar)' }}>
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                <Sidebar onNavigate={() => setSheetOpen(false)} />
              </SheetContent>
            </Sheet>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {session?.user?.name || "User"}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => signOut({ callbackUrl: "/login" })}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* Main content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto">{children}</main>
      </div>

      <Toaster />
    </div>
  );
}
