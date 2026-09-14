import { DashboardShell } from "@/components/shell/DashboardShell";

export default function ShellLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}