import { NextResponse } from "next/server";
import { seedDefaultForm } from "@/scripts/seed";

export const dynamic = "force-dynamic";

/** GET /api/admin/seed — Seeds default form schema (dev only) */
export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }
  const form = await seedDefaultForm();
  return NextResponse.json({ success: true, form });
}
