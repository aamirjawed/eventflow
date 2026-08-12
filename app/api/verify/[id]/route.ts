import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Registration } from "@/models/Registration";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

declare global {
  // eslint-disable-next-line no-var
  var _fallbackRegistrations: any[] | undefined;
}

/** GET /api/verify/[id] — Read-only verification details (does NOT auto check-in) */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  const id = params.id;

  if (!id || typeof id !== "string" || id.length > 50) {
    return NextResponse.json({ error: "Invalid registration ID" }, { status: 400 });
  }

  try {
    let reg: any = null;

    try {
      await connectDB();
      reg = await Registration.findById(id).lean();
    } catch (dbErr) {
      console.warn("[API /api/verify/[id]] DB query fallback:", dbErr);
    }

    // Fallback to memory store if not found in DB
    if (!reg) {
      const memory = global._fallbackRegistrations || [];
      reg = memory.find((r) => String(r._id || r.id) === String(id));
    }

    if (!reg) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const doCheckIn = searchParams.get("checkin") === "true";

    // If checkin action explicitly requested by staff scanner
    if (doCheckIn) {
      reg.isCheckedIn = true;
      reg.isScanned = true;
      reg.checkedInAt = reg.checkedInAt || new Date().toISOString();

      try {
        await connectDB();
        await Registration.findByIdAndUpdate(id, {
          isCheckedIn: true,
          isScanned: true,
          checkedInAt: reg.checkedInAt,
        });
      } catch (saveErr) {
        console.warn("[API /api/verify/[id]] DB update warning:", saveErr);
      }
    }

    return NextResponse.json({
      registration: {
        ...reg,
        email: session ? reg.email : (reg.email || "").replace(/(.{3}).*(@.*)/, "$1***$2"),
        phone: session ? reg.phone : (reg.phone ? reg.phone.replace(/.(?=.{4})/g, "*") : null),
      },
      isCheckedIn: !!reg.isCheckedIn,
      isScanned: !!reg.isScanned,
      isStaff: !!session,
      message: reg.isCheckedIn
        ? "Checked In & Verified"
        : "Valid Ticket Pass (Not Checked In)",
    });
  } catch (error) {
    console.error("Verification GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/** POST /api/verify/[id] — Admin/Staff Gate Check-In Action */
export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  if (!id) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  try {
    const now = new Date().toISOString();
    let updated: any = null;

    try {
      await connectDB();
      updated = await Registration.findByIdAndUpdate(
        id,
        { isCheckedIn: true, isScanned: true, checkedInAt: now },
        { new: true }
      ).lean();
    } catch (dbErr) {
      console.warn("[API /api/verify/[id] POST] DB update fallback:", dbErr);
    }

    // Update memory fallback store as well
    const memory = global._fallbackRegistrations || [];
    const memReg = memory.find((r) => String(r._id || r.id) === String(id));
    if (memReg) {
      memReg.isCheckedIn = true;
      memReg.isScanned = true;
      memReg.checkedInAt = now;
      if (!updated) updated = memReg;
    }

    return NextResponse.json({
      success: true,
      registration: updated,
      message: "Check-in successful!",
    });
  } catch (err: any) {
    console.error("[API /api/verify/[id] POST] Error:", err);
    return NextResponse.json({ error: "Check-in failed" }, { status: 500 });
  }
}
