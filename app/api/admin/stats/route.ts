import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Registration } from "@/models/Registration";

export const dynamic = "force-dynamic";

/** GET /api/admin/stats — Dashboard summary counts */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      await connectDB();
      const [total, preRegistered, registered, checkedIn] = await Promise.all([
        Registration.countDocuments(),
        Registration.countDocuments({ status: "pre_registered" }),
        Registration.countDocuments({ status: "registered" }),
        Registration.countDocuments({ isCheckedIn: true }),
      ]);

      return NextResponse.json({ total, preRegistered, registered, checkedIn });
    } catch (dbErr) {
      console.warn("[API /api/admin/stats] DB Error, returning empty stats fallback:", dbErr);
      return NextResponse.json({ total: 0, preRegistered: 0, registered: 0, checkedIn: 0 });
    }
  } catch (err: any) {
    console.error("[API /api/admin/stats] Server Error:", err);
    return NextResponse.json({ total: 0, preRegistered: 0, registered: 0, checkedIn: 0 });
  }
}
