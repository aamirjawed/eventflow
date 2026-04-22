"use client";

import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import useSWR from "swr";
import { Badge, Skeleton } from "@/components/ui/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/index";
import {
  Printer, Mail, Trash2, Search, UserPlus,
  ChevronLeft, ChevronRight, QrCode, Download, CheckCircle
} from "lucide-react";
import { formatDate, STATUS_COLORS, STATUS_LABELS } from "@/lib/utils";
import { AddRegistrationDialog } from "./AddRegistrationDialog";
import { toast } from "sonner";
import type { IRegistration } from "@/models/Registration";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type Status = "all" | "pre_registered" | "registered" | "checked_in";

export function RegistrationsTable() {
  const [status, setStatus] = useState<Status>("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [addOpen, setAddOpen] = useState(false);

  // Debounce search input
  const handleSearch = useCallback((val: string) => {
    setSearch(val);
    clearTimeout((window as unknown as { _st: ReturnType<typeof setTimeout> })._st);
    (window as unknown as { _st: ReturnType<typeof setTimeout> })._st = setTimeout(() => {
      setDebouncedSearch(val);
      setPage(1);
    }, 350);
  }, []);

  const query = new URLSearchParams({
    status,
    search: debouncedSearch,
    page: String(page),
    limit: "20",
  }).toString();

  const { status: sessionStatus } = useSession();

  const { data, isLoading, mutate } = useSWR<{
    registrations: (IRegistration & { _id: string })[];
    total: number;
  }>(sessionStatus === "authenticated" ? `/api/registrations?${query}` : null, fetcher, { keepPreviousData: true });

  const totalPages = Math.ceil((data?.total || 0) / 20);

  async function handleCheckIn(id: string) {
    await fetch(`/api/registrations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isCheckedIn: true }),
    });
    mutate();
    toast.success("Checked in!");
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this registration?")) return;
    await fetch(`/api/registrations/${id}`, { method: "DELETE" });
    mutate();
    toast.success("Deleted");
  }

  async function handleEmail(id: string) {
    const res = await fetch("/api/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ registrationId: id }),
    });
    if (res.ok) toast.success("Email sent!");
    else toast.error("Failed to send email");
  }

  function handlePrintBadge(id: string) {
    window.open(`/badge/${id}`, "_blank", "width=600,height=400");
  }

  function handleExport() {
    window.location.href = `/api/admin/export?status=${status}`;
  }

  const filterTabs: { label: string; value: Status }[] = [
    { label: "All", value: "all" },
    { label: "Pre-registered", value: "pre_registered" },
    { label: "On-site", value: "registered" },
    { label: "Checked In", value: "checked_in" },
  ];

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-1 flex-wrap">
          {filterTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => { setStatus(tab.value); setPage(1); }}
              className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${status === tab.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search name, email, company..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          <Button variant="outline" size="icon" onClick={handleExport} title="Export CSV">
            <Download className="h-4 w-4" />
          </Button>
          <Button onClick={() => setAddOpen(true)} size="sm" className="gap-1.5">
            <UserPlus className="h-4 w-4" />
            Add
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Name</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground hidden md:table-cell">Email</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground hidden lg:table-cell">Company</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground hidden sm:table-cell">Registered</th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b">
                    {[1, 2, 3, 4, 5, 6].map((j) => (
                      <td key={j} className="py-3 px-4">
                        <Skeleton className="h-4 w-full" />
                      </td>
                    ))}
                  </tr>
                ))
                : data?.registrations?.map((reg) => (
                  <tr key={String(reg._id)} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 font-medium">{reg.name}</td>
                    <td className="py-3 px-4 text-muted-foreground hidden md:table-cell">{reg.email}</td>
                    <td className="py-3 px-4 text-muted-foreground hidden lg:table-cell">{reg.company || "—"}</td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-1">
                        <Badge className={STATUS_COLORS[reg.status]}>
                          {STATUS_LABELS[reg.status]}
                        </Badge>
                        {(reg as any).isCheckedIn && (
                          <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 max-w-fit">
                            <CheckCircle className="h-2.5 w-2.5" />
                            Checked In {formatDate((reg as any).checkedInAt)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground text-xs hidden sm:table-cell">
                      {formatDate(reg.createdAt)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1 justify-end">
                        {!(reg as any).isCheckedIn && (
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Check In"
                            onClick={() => handleCheckIn(String(reg._id))}
                            className="h-7 w-7 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                          >
                            <QrCode className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Print Badge"
                          onClick={() => handlePrintBadge(String(reg._id))}
                          className="h-7 w-7"
                        >
                          <Printer className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Send Email"
                          onClick={() => handleEmail(String(reg._id))}
                          className="h-7 w-7"
                        >
                          <Mail className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Delete"
                          onClick={() => handleDelete(String(reg._id))}
                          className="h-7 w-7 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}

              {!isLoading && (!data || !data.registrations || data.registrations.length === 0) && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    {data && (data as any).error ? `Error: ${(data as any).error}` : "No registrations found"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Showing {((page - 1) * 20) + 1}–{Math.min(page * 20, data?.total || 0)} of {data?.total}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Add Registration Dialog */}
      <AddRegistrationDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSuccess={() => { mutate(); setAddOpen(false); }}
      />
    </div>
  );
}
