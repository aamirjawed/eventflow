import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Registration } from "@/models/Registration";
import { sendConfirmationEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

/** GET /api/registrations — Admin: list all registrations with optional filters */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      console.warn("[API /api/registrations] Unauthorized access attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search")?.trim();
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.max(1, parseInt(searchParams.get("limit") || "20"));

    // Build query
    const query: any = {};
    if (status && status !== "all") {
      if (status === "checked_in") {
        query.isCheckedIn = true;
      } else {
        query.status = status;
      }
    }

    // Safe regex search (doesn't require a text index in MongoDB)
    if (search && search.length > 0) {
      const regex = new RegExp(search, "i");
      query.$or = [
        { name: regex },
        { email: regex },
        { company: regex },
        { phone: regex },
      ];
    }

    try {
      await connectDB();
      const [registrations, total] = await Promise.all([
        Registration.find(query)
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .lean(),
        Registration.countDocuments(query),
      ]);

      return NextResponse.json({ registrations, total, page, limit });
    } catch (dbErr) {
      console.warn("[API /api/registrations] DB Error, returning empty fallback list:", dbErr);
      return NextResponse.json({ registrations: [], total: 0, page, limit });
    }
  } catch (err: any) {
    console.error("[API /api/registrations] Server Error:", err);
    return NextResponse.json({ registrations: [], total: 0, page: 1, limit: 20 });
  }
}

/** POST /api/registrations — Public: pre-register OR Admin: on-site register */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, company, customFields, status } = body;

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
    }

    await connectDB();

    const normalizedEmail = email.trim().toLowerCase();

    // Check for duplicate email safely
    try {
      const existing = await Registration.findOne({ email: normalizedEmail });
      if (existing) {
        return NextResponse.json(
          { error: "This email is already registered" },
          { status: 409 }
        );
      }
    } catch (dupErr) {
      console.warn("[API /api/registrations] Duplicate check warning:", dupErr);
    }

    // Determine status
    const session = await getServerSession(authOptions);
    const resolvedStatus = session ? (status || "registered") : "pre_registered";

    const registration = await Registration.create({
      name,
      email: normalizedEmail,
      phone,
      company,
      customFields: customFields || {},
      status: resolvedStatus,
    });

    // Automatically send confirmation email (Safe non-blocking execution)
    if (resolvedStatus !== "registered") {
      try {
        sendConfirmationEmail(registration).catch((e) =>
          console.warn("[API /api/registrations] Confirmation email background error:", e)
        );
      } catch (emailErr) {
        console.warn("[API /api/registrations] Email trigger warning:", emailErr);
      }
    }

    return NextResponse.json({ registration }, { status: 201 });
  } catch (err: any) {
    console.error("[API /api/registrations] POST Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to complete registration" },
      { status: 500 }
    );
  }
}
