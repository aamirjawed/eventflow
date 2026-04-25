import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { FormSchema } from "@/models/FormSchema";

export const dynamic = "force-dynamic";

/** GET /api/forms?slug=pre-registration — public, used by registration page */
export async function GET(req: NextRequest) {
  console.log("[API] GET /api/forms request received");
  await connectDB();
  console.log("[API] DB connected in /api/forms");

  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug") || "pre-registration";
  console.log(`[API] Fetching form for slug: ${slug}`);

  let form = await FormSchema.findOne({ slug, isActive: true }).lean();
  
  // Auto-seed if it's the default form and it doesn't exist
  if (!form && slug === "pre-registration") {
    console.log("[API] Form not found, attempting to seed...");
    const { seedDefaultForm } = await import("@/scripts/seed");
    await seedDefaultForm();
    form = await FormSchema.findOne({ slug, isActive: true }).lean();
  }

  if (!form) {
    console.warn("[API] Form not found after seeding attempt");
    return NextResponse.json({ error: "Form not found" }, { status: 404 });
  }

  console.log("[API] Form found and returning");
  return NextResponse.json({ form });
}
/** POST /api/forms — Update form schema (Auth ideally required, but keeping simple for now) */
export async function POST(req: NextRequest) {
  await connectDB();
  const body = await req.json();
  const { slug, fields } = body;

  if (!slug || !fields) {
    return NextResponse.json({ error: "Slug and fields are required" }, { status: 400 });
  }

  const form = await FormSchema.findOneAndUpdate(
    { slug },
    { fields },
    { new: true, upsert: true }
  );

  return NextResponse.json({ message: "Form updated", form });
}
