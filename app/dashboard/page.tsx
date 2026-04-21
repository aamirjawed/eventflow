import { Metadata } from "next";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { RegistrationsTable } from "@/components/dashboard/RegistrationsTable";
import { DashboardActions } from "./DashboardActions";

export const metadata: Metadata = {
  title: "Dashboard | EventFlow",
};

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Manage event registrations and check-ins
          </p>
        </div>
        <DashboardActions />
      </div>

      {/* Stats */}
      <StatsCards />

      {/* Registrations table */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Registrations</h2>
        <RegistrationsTable />
      </div>
    </div>
  );
}
