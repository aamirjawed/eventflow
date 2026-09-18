import { NextRequest, NextResponse } from "next/server";
import {
  getBackendRegistrations,
  createBackendRegistration,
} from "@/lib/backendApi";

export const dynamic = "force-dynamic";

/** GET /api/registrations — List all registrations exclusively from Express backend */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "all";
    const search = searchParams.get("search")?.trim() || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.max(1, parseInt(searchParams.get("limit") || "20"));

    const result = await getBackendRegistrations({
      page,
      limit,
      search,
      status,
    });

    return NextResponse.json({
      registrations: result.registrations,
      total: result.total,
      page: result.page,
      limit,
    });
  } catch (err: any) {
    console.error("[API /api/registrations] Express backend error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch from backend", registrations: [], total: 0 },
      { status: 502 }
    );
  }
}

/** POST /api/registrations — Create registration in Express backend */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, company, customFields, status } = body;

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
    }

    const reg = await createBackendRegistration({
      name,
      email,
      phone,
      company,
      customFields,
      status,
    });

    return NextResponse.json({ registration: reg }, { status: 201 });
  } catch (err: any) {
    console.error("[API /api/registrations] Backend POST Error:", err);
    return NextResponse.json({ error: err.message || "Failed to create registration on backend" }, { status: 500 });
  }
}
