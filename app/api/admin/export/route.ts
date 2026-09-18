import { NextRequest, NextResponse } from "next/server";
import { getBackendRegistrations } from "@/lib/backendApi";
import Papa from "papaparse";

export const dynamic = "force-dynamic";

/** GET /api/admin/export — Export registrations directly from Express backend as CSV */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "all";

    // Pull registrations from Express backend
    const result = await getBackendRegistrations({
      limit: 10000,
      status,
    });
    const registrations = result.registrations;

    const rows = registrations.map((r: any) => ({
      id: r._id?.toString() || r.id || "",
      name: r.name || "",
      email: r.email || "",
      phone: r.phone || "",
      company: r.company || "",
      status: r.status || "",
      checkedInAt: r.checkedInAt ? new Date(r.checkedInAt).toISOString() : "",
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : "",
      ...Object.fromEntries(
        Object.entries(r.customFields || {}).map(([k, v]) => [
          `custom_${k}`,
          Array.isArray(v) ? v.join(", ") : String(v ?? ""),
        ])
      ),
    }));

    const csv = Papa.unparse(rows);

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="registrations-${Date.now()}.csv"`,
      },
    });
  } catch (err: any) {
    console.error("[API /api/admin/export] Error:", err);
    return NextResponse.json({ error: "Failed to export registrations" }, { status: 500 });
  }
}
