import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Registration } from "@/models/Registration";
import { sendConfirmationEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

/** POST /api/email/send — MANUALLY Send confirmation email to a registrant */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();

    const { registrationId } = await req.json();
    const reg = await Registration.findById(registrationId).lean();
    if (!reg) return NextResponse.json({ error: "Registration not found" }, { status: 404 });

    try {
      await sendConfirmationEmail(reg);
      return NextResponse.json({ success: true });
    } catch (emailErr) {
      console.error("[API /api/email/send] Email send warning:", emailErr);
      return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
    }
  } catch (err: any) {
    console.error("[API /api/email/send] Error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
