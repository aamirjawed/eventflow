import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Registration } from "@/models/Registration";

export const dynamic = "force-dynamic";

/** GET /api/badge/[id] — Fetch registration data for badge printing */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const reg = await Registration.findById(params.id).lean();
    if (!reg) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({
      id: reg._id.toString(),
      name: reg.name,
      email: reg.email,
      company: reg.company || "",
      status: reg.status,
    });
  } catch (err: any) {
    console.error("[API /api/badge/[id]] GET Error:", err);
    return NextResponse.json({ error: "Badge not found" }, { status: 404 });
  }
}
