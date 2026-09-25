// src/components/shell/DashboardShell.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  Bell,
  Settings,
  LayoutDashboard,
  Newspaper,
  Feather,
  CodeXml,
  Trophy,
  ArrowLeft,
  Headset,
  MessagesSquare,
  GraduationCap,
  GitBranchIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { GiThumbDown } from "react-icons/gi";

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
  { label: "News", href: "/news", icon: <Newspaper className="size-5" /> },
  { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard className="size-5" /> },
  { label: "Article", href: "/article", icon: <Feather className="size-5" /> },
  { label: "Problem Solving", href: "/problemSolving", icon: <CodeXml className="size-5" /> },
  { label: "Open Source", href: "/opensource", icon: <GitBranchIcon className="size-5" /> },
  { label: "Academics", href: "/academics", icon: <GraduationCap className="size-5" /> },
  { label: "Connect", href: "/connect", icon: <Headset className="size-5" /> },
  { label: "Feedback", href: "/feedback", icon: <MessagesSquare className="size-5" /> },
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
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationTriggerRef = useRef<HTMLButtonElement>(null);
  const notificationCloseButtonRef = useRef<HTMLButtonElement>(null);
  const notificationDrawerRef = useRef<HTMLElement>(null);
  const pathname = usePathname();

  const getPageTitle = () => {
    const match = navItems.find((item) => item.href === pathname);
    if (match) return match.label;
    // fallback: capitalize the last segment of the path
    const segment = pathname.split("/").filter(Boolean).pop();
    return segment ? segment.charAt(0).toUpperCase() + segment.slice(1) : "Dashboard";
  };

  useEffect(() => {
    if (!notificationsOpen) return;

    const drawer = notificationDrawerRef.current;
    const notificationTrigger = notificationTriggerRef.current;
    const focusableSelector =
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

    notificationCloseButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setNotificationsOpen(false);
        return;
      }

      if (event.key !== "Tab" || !drawer) return;

      const focusableElements = Array.from(
        drawer.querySelectorAll<HTMLElement>(focusableSelector)
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (!firstElement || !lastElement) {
        event.preventDefault();
        return;
      }

      const focusIsOutsideDrawer = !drawer.contains(document.activeElement);
      if (event.shiftKey && (document.activeElement === firstElement || focusIsOutsideDrawer)) {
        event.preventDefault();
        lastElement.focus();
      } else if (
        !event.shiftKey &&
        (document.activeElement === lastElement || focusIsOutsideDrawer)
      ) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      notificationTrigger?.focus();
    };
  }, [notificationsOpen]);

  const glass =
    "bg-white/5 backdrop-blur-md border border-white/10 dark:bg-white/5 dark:border-white/10 light:bg-black/5 light:border-black/10";

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      {/* LEFT SIDEBAR */}
      <aside
        className={cn(
          "hidden lg:flex lg:w-[15%] flex-col h-full shrink-0",
          glass,
          "border-r"
        )}
      >
        {/* Top 10% - company name */}
        <div className="h-[7.55%] flex items-center px-5 border-b border-white/10">
          <Link href="/" className="flex items-center gap-2">
            <ArrowLeft className="size-6 hover:text-blue-400 transition-colors duration-300" />
            {/* <Image src="/logo.svg" alt={companyName} width={28} height={28} className="rounded-full" /> */}
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
            <Settings className="size-5 text-muted-foreground hover:text-foreground transition-colors" />
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

      {/* MAIN SECTION */}
      <main className="flex-1 min-w-0 h-full flex flex-col overflow-hidden">
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
          <div className="flex-1 flex items-center px-2">
            <h2 className="text-sm sm:text-base font-semibold">
              {topBarContent ?? getPageTitle()}
            </h2>
          </div>
          <button
            ref={notificationTriggerRef}
            type="button"
            onClick={() => {
              setMobileOpen(false);
              setNotificationsOpen((open) => !open);
            }}
            aria-label={notificationsOpen ? "Close notifications" : "Open notifications"}
            aria-haspopup="dialog"
            aria-expanded={notificationsOpen}
            aria-controls="notifications-drawer"
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Bell className="size-5" aria-hidden="true" />
          </button>
        </div>

        {/* Variable main content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</div>
      </main>

      {/* NOTIFICATION DRAWER */}
      <div
        className={cn(
          "pointer-events-none fixed inset-0 z-[60]",
          notificationsOpen && "pointer-events-auto"
        )}
        aria-hidden={!notificationsOpen}
        inert={!notificationsOpen}
      >
        <button
          type="button"
          tabIndex={-1}
          disabled={!notificationsOpen}
          aria-label="Close notifications"
          onClick={() => setNotificationsOpen(false)}
          className={cn(
            "absolute inset-0 cursor-default bg-black/55 backdrop-blur-sm transition-opacity duration-300 motion-reduce:transition-none",
            notificationsOpen ? "opacity-100" : "opacity-0"
          )}
        />
        <aside
          id="notifications-drawer"
          ref={notificationDrawerRef}
          role="dialog"
          aria-modal={notificationsOpen ? true : undefined}
          aria-labelledby="notifications-heading"
          className={cn(
            "absolute inset-y-0 right-0 flex w-full max-w-md flex-col overflow-hidden border-l border-white/10 bg-background/95 shadow-2xl shadow-black/40 backdrop-blur-xl transition-transform duration-300 ease-in-out motion-reduce:transition-none",
            notificationsOpen ? "translate-x-0" : "translate-x-full"
          )}
        >
          <div className="flex shrink-0 items-center justify-between gap-4 border-b border-white/10 px-5 py-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Bell className="size-5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <h2 id="notifications-heading" className="font-semibold tracking-tight">
                  Notifications
                </h2>
                <p className="text-xs text-muted-foreground">Your latest updates</p>
              </div>
            </div>
            <button
              ref={notificationCloseButtonRef}
              type="button"
              onClick={() => setNotificationsOpen(false)}
              aria-label="Close notifications"
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto overscroll-contain p-5 sm:p-6">
            {rightPanel ?? (
              <div className="mx-auto flex min-h-[16rem] max-w-xs flex-col items-center justify-center text-center">
                <div className="mb-4 flex size-14 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-muted-foreground">
                  <Bell className="size-6" aria-hidden="true" />
                </div>
                <h3 className="text-sm font-semibold">You&apos;re all caught up</h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  New notifications will show up here when there&apos;s something to share.
                </p>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
