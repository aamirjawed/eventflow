import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Registration } from "@/models/Registration";

export const dynamic = "force-dynamic";

// Declare fallback store reference
declare global {
  // eslint-disable-next-line no-var
  var _fallbackRegistrations: any[] | undefined;
}

/** GET /api/admin/stats — Dashboard summary counts */
export async function GET() {
  try {
    const memory = global._fallbackRegistrations || [];
    let dbTotal = 0;
    let dbPre = 0;
    let dbReg = 0;
    let dbCheck = 0;

    try {
      await connectDB();
      const [total, preRegistered, registered, checkedIn] = await Promise.all([
        Registration.countDocuments(),
        Registration.countDocuments({ status: "pre_registered" }),
        Registration.countDocuments({ status: "registered" }),
        Registration.countDocuments({ isCheckedIn: true }),
      ]);
      dbTotal = total;
      dbPre = preRegistered;
      dbReg = registered;
      dbCheck = checkedIn;
    } catch (dbErr) {
      console.warn("[API /api/admin/stats] DB stats warning (using memory stats):", dbErr);
    }

    const memPre = memory.filter((r) => r.status === "pre_registered").length;
    const memReg = memory.filter((r) => r.status === "registered").length;
    const memCheck = memory.filter((r) => r.isCheckedIn).length;

    return NextResponse.json({
      total: dbTotal + memory.length,
      preRegistered: dbPre + memPre,
      registered: dbReg + memReg,
      checkedIn: dbCheck + memCheck,
    });
  } catch (err: any) {
    console.error("[API /api/admin/stats] Server Error:", err);
    return NextResponse.json({ total: 0, preRegistered: 0, registered: 0, checkedIn: 0 });
  }
}
