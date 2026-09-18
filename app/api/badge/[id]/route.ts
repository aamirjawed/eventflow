import { NextRequest, NextResponse } from "next/server";
import { getBackendRegistrationById } from "@/lib/backendApi";

export const dynamic = "force-dynamic";

/** GET /api/badge/[id] — Fetch registration data from backend for badge */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const reg = await getBackendRegistrationById(params.id);
    if (!reg) return NextResponse.json({ error: "Badge not found" }, { status: 404 });

    return NextResponse.json({
      id: reg._id,
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
