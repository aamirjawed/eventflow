import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Registration } from "@/models/Registration";
import mongoose from "mongoose";
import { sendConfirmationEmail } from "@/lib/email";

/** GET /api/registrations — Admin: list all registrations with optional filters */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    console.warn("[API] Registrations: Unauthorized access attempt");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  console.log(`[API] Connected to DB: ${mongoose.connection.name}`);

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const search = searchParams.get("search");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");

  // Build query
  const query: any = {};
  if (status && status !== "all") {
    if (status === "checked_in") {
      query.isCheckedIn = true;
    } else {
      query.status = status;
    }
  }
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { company: { $regex: search, $options: "i" } },
    ];
  }

  console.log("[API] Registration Query:", JSON.stringify(query));

  const [registrations, total] = await Promise.all([
    Registration.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Registration.countDocuments(query),
  ]);

  console.log(`[API] Found ${registrations.length} registrations (Total: ${total})`);

  return NextResponse.json({ registrations, total, page, limit });
}

/** POST /api/registrations — Public: pre-register OR Admin: on-site register */
export async function POST(req: NextRequest) {
  await connectDB();

  const body = await req.json();
  const { name, email, phone, company, customFields, status } = body;

  if (!name || !email) {
    return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
  }

  // Check for duplicate email
  const existing = await Registration.findOne({ email: email.toLowerCase() });
  if (existing) {
    return NextResponse.json(
      { error: "This email is already registered" },
      { status: 409 }
    );
  }

  // Only admins can set status to "registered"
  const session = await getServerSession(authOptions);
  const resolvedStatus = session ? (status || "registered") : "pre_registered";

  const registration = await Registration.create({
    name,
    email,
    phone,
    company,
    customFields: customFields || {},
    status: resolvedStatus,
  });

  // Automatically send confirmation email
  try {
    const emailResult = await sendConfirmationEmail(registration);
    if (emailResult.error) {
      console.error("[API] Resend returned an error:", emailResult.error);
    } else {
      console.log("[API] Registration email sent successfully!");
    }
  } catch (err) {
    console.error("[API] CRITICAL: Failed to auto-send registration email:", err);
  }

  return NextResponse.json({ registration }, { status: 201 });
}
