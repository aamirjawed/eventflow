import { NextResponse } from "next/server";
import { getBackendRegistrations } from "@/lib/backendApi";

export const dynamic = "force-dynamic";

/** GET /api/admin/stats — Dashboard summary metrics exclusively from Express backend */
export async function GET() {
  try {
    const result = await getBackendRegistrations({ page: 1, limit: 1 });
    const stats = result.globalStats || {
      totalUsers: 0,
      totalOnline: 0,
      totalOnsite: 0,
      totalCheckedIn: 0,
    };

    return NextResponse.json({
      total: stats.totalUsers ?? result.total ?? 0,
      preRegistered: stats.totalOnline ?? 0,
      registered: stats.totalOnsite ?? 0,
      checkedIn: stats.totalCheckedIn ?? 0,
    });
  } catch (err: any) {
    console.error("[API /api/admin/stats] Backend stats error:", err);
    return NextResponse.json({ total: 0, preRegistered: 0, registered: 0, checkedIn: 0 });
  }
}
