import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Registration } from "@/models/Registration";

/** GET /api/badge/[id] — Fetch registration data for badge printing (no auth needed, id is opaque) */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
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
}
