import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { FormSchema } from "@/models/FormSchema";

export const dynamic = "force-dynamic";

const DEFAULT_FORM = {
  name: "Event Pre-Registration",
  slug: "pre-registration",
  description: "Register for the event in advance.",
  isActive: true,
  fields: [
    { id: "name", label: "Full Name", type: "text", required: true, placeholder: "John Doe", order: 1 },
    { id: "email", label: "Email Address", type: "email", required: true, placeholder: "john@example.com", order: 2 },
    { id: "phone", label: "Phone Number", type: "phone", required: false, placeholder: "+91 98765 43210", order: 3 },
    { id: "company", label: "Company / Organisation", type: "text", required: false, placeholder: "Acme Inc.", order: 4 },
    {
      id: "role",
      label: "Your Role",
      type: "select",
      required: false,
      options: ["Developer", "Designer", "Manager", "Founder", "Student", "Other"],
      order: 5,
    },
    {
      id: "tshirt",
      label: "T-Shirt Size",
      type: "select",
      required: false,
      options: ["XS", "S", "M", "L", "XL", "XXL"],
      order: 6,
    },
    {
      id: "newsletter",
      label: "Subscribe to newsletter",
      type: "checkbox",
      required: false,
      order: 7,
    },
  ],
};

/** GET /api/forms?slug=pre-registration — public, used by registration page & dashboard */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug") || "pre-registration";

    try {
      await connectDB();
      let form = await FormSchema.findOne({ slug, isActive: true }).lean();

      if (!form && slug === "pre-registration") {
        try {
          form = (await FormSchema.create(DEFAULT_FORM)).toObject();
        } catch {
          form = DEFAULT_FORM as any;
        }
      }

      return NextResponse.json({ form: form || DEFAULT_FORM });
    } catch (dbErr) {
      console.warn("[API /api/forms] DB connection error, returning fallback schema:", dbErr);
      return NextResponse.json({ form: DEFAULT_FORM });
    }
  } catch (err: any) {
    console.error("[API /api/forms] Request processing error:", err);
    return NextResponse.json({ form: DEFAULT_FORM });
  }
}

/** POST /api/forms — Update form schema */
export async function POST(req: NextRequest) {
  try {
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
  } catch (err: any) {
    console.error("[API /api/forms] POST error:", err);
    return NextResponse.json({ error: err.message || "Failed to update form" }, { status: 500 });
  }
}
