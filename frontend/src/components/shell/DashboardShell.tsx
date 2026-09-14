// src/components/sections/DashboardShell.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, Bell, Settings, LayoutDashboard, Compass, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

interface DashboardShellProps {
  children: React.ReactNode;
  navItems?: NavItem[];
  companyName?: string;
  userName?: string;
  userAvatar?: string;
  topBarContent?: React.ReactNode;
  rightPanel?: React.ReactNode;
}

const defaultNavItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard className="size-5" /> },
  { label: "Explore", href: "/dashboard/explore", icon: <Compass className="size-5" /> },
  { label: "Profile", href: "/dashboard/profile", icon: <User className="size-5" /> },
];

export function DashboardShell({
  children,
  navItems = defaultNavItems,
  companyName = "Backspaces",
  userName = "Vidit Sharma",
  userAvatar = "/logo.svg",
  topBarContent,
  rightPanel,
}: DashboardShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const glass =
    "bg-white/5 backdrop-blur-md border border-white/10 dark:bg-white/5 dark:border-white/10 light:bg-black/5 light:border-black/10";

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      {/* LEFT SIDEBAR - 20% */}
      <aside
        className={cn(
          "hidden lg:flex lg:w-[15%] flex-col h-full shrink-0",
          glass,
          "border-r"
        )}
      >
        {/* Top 10% - company name */}
        <div className="h-[10%] min-h-[64px] flex items-center px-5 border-b border-white/10">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.svg" alt={companyName} width={28} height={28} className="rounded-full" />
            <span className="font-semibold text-lg tracking-tight">{companyName}</span>
          </Link>
        </div>

        {/* Middle 80% - nav links */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Bottom 10% - user profile */}
        <div className="h-[10%] min-h-[64px] flex items-center justify-between px-4 border-t border-white/10">
          <div className="flex items-center gap-2 min-w-0">
            <Image
              src={userAvatar}
              alt={userName}
              width={32}
              height={32}
              className="rounded-full border border-white/10 object-cover shrink-0"
            />
            <span className="text-sm font-medium truncate">{userName}</span>
          </div>
          <Link href="/dashboard/settings" aria-label="Settings">
            <Settings className="size-4 text-muted-foreground hover:text-foreground transition-colors" />
          </Link>
        </div>
      </aside>

      {/* MOBILE SIDEBAR DRAWER */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setMobileOpen(false)}
          />
          <aside className={cn("absolute left-0 top-0 h-full w-[75%] max-w-xs flex flex-col", glass)}>
            <div className="h-16 flex items-center justify-between px-5 border-b border-white/10">
              <span className="font-semibold text-lg">{companyName}</span>
              <button onClick={() => setMobileOpen(false)} aria-label="Close menu">
                <X className="size-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
                >
                  {item.icon}
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="flex items-center justify-between px-4 py-4 border-t border-white/10">
              <div className="flex items-center gap-2 min-w-0">
                <Image
                  src={userAvatar}
                  alt={userName}
                  width={32}
                  height={32}
                  className="rounded-full border border-white/10 object-cover shrink-0"
                />
                <span className="text-sm font-medium truncate">{userName}</span>
              </div>
              <Link href="/dashboard/settings" aria-label="Settings">
                <Settings className="size-4 text-muted-foreground" />
              </Link>
            </div>
          </aside>
        </div>
      )}

      {/* MAIN SECTION - 70% */}
      <main className="flex-1 lg:w-[75%] h-full flex flex-col overflow-hidden">
        {/* Top navbar inside main */}
        <div
          className={cn(
            "h-14 shrink-0 flex items-center justify-between px-4 border-b border-white/10",
            glass
          )}
        >
          <button
            className="lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="size-5" />
          </button>
          <div className="flex-1 flex items-center">{topBarContent}</div>
          <Link href="/dashboard/notifications" className="lg:hidden" aria-label="Notifications">
            <Bell className="size-5 text-muted-foreground" />
          </Link>
        </div>

        {/* Variable main content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</div>
      </main>

      {/* RIGHT SECTION - 10% */}
      <aside
        className={cn(
          "hidden xl:flex xl:w-[10%] h-full flex-col shrink-0 border-l overflow-y-auto p-3 gap-3",
          glass
        )}
      >
        <div className="flex items-center justify-center h-10 shrink-0">
          <Bell className="size-5 text-muted-foreground" />
        </div>
        <div className="flex-1 overflow-y-auto space-y-3">
          {rightPanel ?? (
            <p className="text-xs text-muted-foreground text-center px-1">
              No updates yet
            </p>
          )}
        </div>
      </aside>
    </div>
  );
}