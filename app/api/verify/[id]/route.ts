import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Registration } from "@/models/Registration";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Allow public access but we will mask data in the response if not logged in
  const session = await getServerSession(authOptions);
  
  // Sanitize input
  const id = params.id;
  if (!id || typeof id !== 'string' || id.length > 50) {
    return NextResponse.json({ error: "Invalid registration ID" }, { status: 400 });
  }

  try {
    await connectDB();
    const reg = await Registration.findById(id);

    if (!reg) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 });
    }

    const now = new Date();
    const isActuallyNewScan = !reg.isScanned || !reg.isCheckedIn;
    
    // If it was scanned very recently (grace period for reloads/double-taps), we don't treat it as "Already Scanned"
    const gracePeriodMs = 30000; // 30 seconds
    const wasRecentlyScanned = reg.scannedAt && (now.getTime() - new Date(reg.scannedAt).getTime() < gracePeriodMs);
    
    const shouldReportAlreadyScanned = reg.isScanned && !wasRecentlyScanned;

    // Update the record if needed
    if (isActuallyNewScan) {
      reg.isScanned = true;
      reg.scannedAt = reg.scannedAt || now;
      reg.isCheckedIn = true;
      reg.checkedInAt = reg.checkedInAt || now;
      await reg.save();
    }

    // Prepare response data (Mask PII for public users)
    const result = {
      registration: {
        ...reg.toObject(),
        // Mask PII if not staff
        email: session ? reg.email : reg.email.replace(/(.{3}).*(@.*)/, "$1***$2"),
        phone: session ? reg.phone : (reg.phone ? reg.phone.replace(/.(?=.{4})/g, "*") : null),
      },
      alreadyScanned: shouldReportAlreadyScanned,
      isStaff: !!session,
      message: shouldReportAlreadyScanned 
        ? "This QR code was already scanned in a previous session." 
        : "QR code verified successfully!"
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
