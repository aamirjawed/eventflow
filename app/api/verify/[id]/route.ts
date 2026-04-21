import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Registration } from "@/models/Registration";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const reg = await Registration.findById(params.id);

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

    return NextResponse.json({
      registration: reg,
      alreadyScanned: shouldReportAlreadyScanned,
      message: shouldReportAlreadyScanned 
        ? "This QR code was already scanned in a previous session." 
        : "QR code verified successfully!"
    });
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
