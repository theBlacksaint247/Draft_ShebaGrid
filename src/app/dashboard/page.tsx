import type { Metadata } from "next";
import { DashboardView } from "@/components/DashboardView";
import { RoleGate } from "@/components/shell/RoleGate";
import { OFFICERS } from "@/lib/people";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function DashboardPage() {
  return (
    <RoleGate allow={OFFICERS} subject="the dashboard">
      <DashboardView />
    </RoleGate>
  );
}
