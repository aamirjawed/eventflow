import { Metadata } from "next";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { RegistrationsTable } from "@/components/dashboard/RegistrationsTable";

export const metadata: Metadata = {
  title: "Dashboard | EventFlow",
};

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Manage event registrations and check-ins
          </p>
        </div>
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
