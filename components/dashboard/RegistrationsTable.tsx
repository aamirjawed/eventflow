"use client";

import { useState, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import useSWR from "swr";
import { Badge, Skeleton } from "@/components/ui/index";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/index";
import {
  Printer, Mail, Trash2, Search, UserPlus,
  ChevronLeft, ChevronRight, QrCode, Download, CheckCircle,
  Columns, Filter
} from "lucide-react";
import { formatDate, STATUS_COLORS, STATUS_LABELS } from "@/lib/utils";
import { AddRegistrationDialog } from "./AddRegistrationDialog";
import { PrintTicketButton } from "@/components/printer/PrintTicketButton";
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

  // Column Visibility State
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    name: true,
    email: true,
    company: true,
    status: true,
    createdAt: true,
  });

  // Fetch form schema to know dynamic fields
  const { data: formData } = useSWR("/api/forms?slug=pre-registration", fetcher);
  
  const dynamicFields = useMemo(() => {
    const fields = formData?.form?.fields || [];
    // Aggressively filter out fields that overlap with standard columns
    // We look for keywords that suggest the field is meant to be Name, Email, or Company
    const reservedKeywords = ["name", "email", "company", "organization", "organisation"];
    
    return fields.filter((f: any) => {
      const label = f.label.toLowerCase();
      // If the label contains any of our reserved keywords, it's likely a duplicate of a standard field
      const isDuplicate = reservedKeywords.some(keyword => label.includes(keyword));
      return !isDuplicate;
    });
  }, [formData]);

  // Debounce search input
  const handleSearch = useCallback((val: string) => {
    setSearch(val);
    clearTimeout((window as any)._st);
    (window as any)._st = setTimeout(() => {
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

  const toggleColumn = (key: string) => {
    setVisibleColumns(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const filterTabs: { label: string; value: Status }[] = [
    { label: "All", value: "all" },
    { label: "Pre-registered", value: "pre_registered" },
    { label: "On-site", value: "registered" },
    { label: "Checked In", value: "checked_in" },
  ];

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between bg-white p-4 rounded-xl border shadow-sm">
        <div className="flex gap-1 flex-wrap">
          {filterTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => { setStatus(tab.value); setPage(1); }}
              className={`px-3 py-1.5 text-xs rounded-lg font-bold transition-all ${status === tab.value
                ? "bg-primary text-white shadow-md shadow-primary/20 scale-105"
                : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search attendee..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-8 h-9 text-sm rounded-lg"
            />
          </div>

          {/* Column Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 h-9">
                <Columns className="h-4 w-4" />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Standard Fields</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem checked={visibleColumns.name} onCheckedChange={() => toggleColumn("name")}>
                Name
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={visibleColumns.email} onCheckedChange={() => toggleColumn("email")}>
                Email
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={visibleColumns.company} onCheckedChange={() => toggleColumn("company")}>
                Company
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={visibleColumns.status} onCheckedChange={() => toggleColumn("status")}>
                Status
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={visibleColumns.createdAt} onCheckedChange={() => toggleColumn("createdAt")}>
                Date Registered
              </DropdownMenuCheckboxItem>

              {dynamicFields.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Custom Fields</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {dynamicFields.map((field: any) => (
                    <DropdownMenuCheckboxItem
                      key={field.id}
                      checked={visibleColumns[field.id]}
                      onCheckedChange={() => toggleColumn(field.id)}
                    >
                      {field.label}
                    </DropdownMenuCheckboxItem>
                  ))}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="outline" size="icon" onClick={handleExport} title="Export CSV" className="h-9 w-9">
            <Download className="h-4 w-4" />
          </Button>
          <Button onClick={() => setAddOpen(true)} size="sm" className="gap-1.5 h-9 bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-100">
            <UserPlus className="h-4 w-4" />
            Add
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-slate-50/50">
                {visibleColumns.name && <th className="text-left py-4 px-6 font-bold text-slate-900">Name</th>}
                {visibleColumns.email && <th className="text-left py-4 px-6 font-bold text-slate-900 hidden md:table-cell">Email</th>}
                {visibleColumns.company && <th className="text-left py-4 px-6 font-bold text-slate-900 hidden lg:table-cell">Company</th>}

                {/* Dynamic Columns */}
                {dynamicFields.map((field: any) => visibleColumns[field.id] && (
                  <th key={field.id} className="text-left py-4 px-6 font-bold text-slate-900">
                    {field.label}
                  </th>
                ))}

                {visibleColumns.status && <th className="text-left py-4 px-6 font-bold text-slate-900">Status</th>}
                {visibleColumns.createdAt && <th className="text-left py-4 px-6 font-bold text-slate-900 hidden sm:table-cell">Registered</th>}
                <th className="text-right py-4 px-6 font-bold text-slate-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {visibleColumns.name && <td className="py-4 px-6"><Skeleton className="h-4 w-32" /></td>}
                    {visibleColumns.email && <td className="py-4 px-6 hidden md:table-cell"><Skeleton className="h-4 w-40" /></td>}
                    {visibleColumns.company && <td className="py-4 px-6 hidden lg:table-cell"><Skeleton className="h-4 w-24" /></td>}
                    {dynamicFields.map((f: any) => visibleColumns[f.id] && <td key={f.id} className="py-4 px-6"><Skeleton className="h-4 w-20" /></td>)}
                    {visibleColumns.status && <td className="py-4 px-6"><Skeleton className="h-4 w-20" /></td>}
                    {visibleColumns.createdAt && <td className="py-4 px-6 hidden sm:table-cell"><Skeleton className="h-4 w-24" /></td>}
                    <td className="py-4 px-6"><Skeleton className="h-4 w-24 ml-auto" /></td>
                  </tr>
                ))
                : data?.registrations?.map((reg) => {
                  // Helper to find data in customFields if standard field is empty
                  const getFallback = (key: string) => {
                    if (!reg.customFields) return null;
                    const customKey = Object.keys(reg.customFields).find(k => k.toLowerCase().includes(key.toLowerCase()));
                    return customKey ? reg.customFields[customKey] : null;
                  };

                  const displayName = reg.name || getFallback("name") || "—";
                  const displayEmail = reg.email || getFallback("email") || "—";
                  const displayCompany = reg.company || getFallback("company") || getFallback("organization") || "—";

                  return (
                    <tr key={String(reg._id)} className="hover:bg-slate-50/80 transition-colors group">
                      {visibleColumns.name && <td className="py-4 px-6 font-bold text-slate-900">{String(displayName)}</td>}
                      {visibleColumns.email && <td className="py-4 px-6 text-slate-500 hidden md:table-cell">{String(displayEmail)}</td>}
                      {visibleColumns.company && <td className="py-4 px-6 text-slate-500 hidden lg:table-cell">{String(displayCompany)}</td>}

                      {/* Dynamic Data Cells */}
                      {dynamicFields.map((field: any) => visibleColumns[field.id] && (
                        <td key={field.id} className="py-4 px-6 text-slate-500">
                          {String(reg.customFields?.[field.id] || "—")}
                        </td>
                      ))}

                      {visibleColumns.status && (
                        <td className="py-4 px-6">
                          <div className="flex flex-col gap-1">
                            <Badge className={`${STATUS_COLORS[reg.status]} text-[10px] px-2 py-0.5 rounded-md`}>
                              {STATUS_LABELS[reg.status]}
                            </Badge>
                            {(reg as any).isCheckedIn && (
                              <div className="flex items-center gap-1 text-[9px] text-emerald-600 font-black bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 max-w-fit uppercase tracking-tighter">
                                <CheckCircle className="h-2.5 w-2.5" />
                                Checked In {reg.checkedInAt && formatDate(reg.checkedInAt)}
                              </div>
                            )}
                          </div>
                        </td>
                      )}
                      {visibleColumns.createdAt && (
                        <td className="py-4 px-6 text-slate-400 text-xs hidden sm:table-cell font-medium">
                          {formatDate(reg.createdAt)}
                        </td>
                      )}
                      <td className="py-4 px-6">
                        <div className="flex gap-1 justify-end">
                          {!(reg as any).isCheckedIn && (
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Check In"
                              onClick={() => handleCheckIn(String(reg._id))}
                              className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100 rounded-lg"
                            >
                              <QrCode className="h-4 w-4" />
                            </Button>
                          )}
                          <PrintTicketButton
                            ticket={{
                              id: String(reg._id),
                              name: String(displayName),
                              email: String(displayEmail),
                              company: String(displayCompany) !== "—" ? String(displayCompany) : undefined,
                              status: reg.status,
                            }}
                            variant="ghost"
                            size="icon"
                            title="Print Sunmi Thermal Ticket"
                            className="h-8 w-8 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Send Email"
                            onClick={() => handleEmail(String(reg._id))}
                            className="h-8 w-8 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg"
                          >
                            <Mail className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Delete"
                            onClick={() => handleDelete(String(reg._id))}
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

              {!isLoading && (!data || !data.registrations || data.registrations.length === 0) && (
                <tr>
                  <td colSpan={10} className="py-20 text-center text-slate-400 font-medium italic">
                    {data && (data as any).error ? `Error: ${(data as any).error}` : "No registrations found matching your filters"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-slate-500 bg-white p-4 rounded-xl border shadow-sm">
          <span className="font-medium">
            Showing <span className="text-slate-900">{((page - 1) * 20) + 1}–{Math.min(page * 20, data?.total || 0)}</span> of <span className="text-slate-900 font-bold">{data?.total}</span> attendees
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="h-9 w-9 rounded-lg"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="h-9 w-9 rounded-lg"
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
