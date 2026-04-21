import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { FormSchema } from "@/models/FormSchema";

export const dynamic = "force-dynamic";

/** GET /api/forms?slug=pre-registration — public, used by registration page */
export async function GET(req: NextRequest) {
  await connectDB();

  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug") || "pre-registration";

  let form = await FormSchema.findOne({ slug, isActive: true }).lean();
  
  // Auto-seed if it's the default form and it doesn't exist
  if (!form && slug === "pre-registration") {
    const { seedDefaultForm } = await import("@/scripts/seed");
    await seedDefaultForm();
    form = await FormSchema.findOne({ slug, isActive: true }).lean();
  }

  if (!form) return NextResponse.json({ error: "Form not found" }, { status: 404 });

  return NextResponse.json({ form });
}
