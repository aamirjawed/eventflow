import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Registration } from "@/models/Registration";
import Papa from "papaparse";

export const dynamic = "force-dynamic";

/** GET /api/admin/export — Export registrations as CSV */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const query: any = {};
    if (status && status !== "all") query.status = status;

    const registrations = await Registration.find(query).sort({ createdAt: -1 }).lean();

    const rows = registrations.map((r) => ({
      id: r._id.toString(),
      name: r.name,
      email: r.email,
      phone: r.phone || "",
      company: r.company || "",
      status: r.status,
      checkedInAt: r.checkedInAt ? new Date(r.checkedInAt).toISOString() : "",
      createdAt: new Date(r.createdAt).toISOString(),
      ...Object.fromEntries(
        Object.entries(r.customFields || {}).map(([k, v]) => [
          `custom_${k}`,
          Array.isArray(v) ? v.join(", ") : String(v),
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
