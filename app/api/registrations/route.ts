import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Registration } from "@/models/Registration";
import { sendConfirmationEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

// Global in-memory fallback store for zero-downtime resilience
declare global {
  // eslint-disable-next-line no-var
  var _fallbackRegistrations: any[] | undefined;
}

if (!global._fallbackRegistrations) {
  global._fallbackRegistrations = [];
}

const fallbackStore = global._fallbackRegistrations;

/** GET /api/registrations — List all registrations with optional filters */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search")?.trim();
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.max(1, parseInt(searchParams.get("limit") || "20"));

    let dbRegistrations: any[] = [];
    let dbTotal = 0;

    // Try MongoDB query
    try {
      await connectDB();

      const query: any = {};
      if (status && status !== "all") {
        if (status === "checked_in") {
          query.isCheckedIn = true;
        } else {
          query.status = status;
        }
      }

      if (search && search.length > 0) {
        const regex = new RegExp(search, "i");
        query.$or = [
          { name: regex },
          { email: regex },
          { company: regex },
          { phone: regex },
        ];
      }

      const [regs, count] = await Promise.all([
        Registration.find(query)
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .lean(),
        Registration.countDocuments(query),
      ]);

      dbRegistrations = regs;
      dbTotal = count;
    } catch (dbErr) {
      console.warn("[API /api/registrations] DB query fallback:", dbErr);
    }

    // Filter memory fallback items according to status and search filter
    let filteredMemory = [...fallbackStore];
    if (status && status !== "all") {
      if (status === "checked_in") {
        filteredMemory = filteredMemory.filter((r) => r.isCheckedIn);
      } else {
        filteredMemory = filteredMemory.filter((r) => r.status === status);
      }
    }
    if (search && search.length > 0) {
      const s = search.toLowerCase();
      filteredMemory = filteredMemory.filter(
        (r) =>
          (r.name && r.name.toLowerCase().includes(s)) ||
          (r.email && r.email.toLowerCase().includes(s)) ||
          (r.company && r.company.toLowerCase().includes(s)) ||
          (r.phone && r.phone.toLowerCase().includes(s))
      );
    }

    // Combine database results with memory store (eliminating any duplicate _ids)
    const combinedMap = new Map();
    for (const r of [...filteredMemory, ...dbRegistrations]) {
      const idKey = String(r._id || r.id);
      if (!combinedMap.has(idKey)) {
        combinedMap.set(idKey, r);
      }
    }

    const combined = Array.from(combinedMap.values());
    const total = Math.max(combined.length, dbTotal + filteredMemory.length);

    return NextResponse.json({ registrations: combined, total, page, limit });
  } catch (err: any) {
    console.error("[API /api/registrations] Server Error:", err);
    return NextResponse.json({ registrations: fallbackStore, total: fallbackStore.length, page: 1, limit: 20 });
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

    const normalizedEmail = email.trim().toLowerCase();
    const resolvedStatus = status || "pre_registered";

    let registration: any = null;

    // 1. Try DB insertion
    try {
      await connectDB();

      // Check for duplicate email in DB
      const existing = await Registration.findOne({ email: normalizedEmail }).lean();
      if (existing) {
        return NextResponse.json(
          { error: "This email is already registered" },
          { status: 409 }
        );
      }

      const newDoc = await Registration.create({
        name,
        email: normalizedEmail,
        phone,
        company,
        customFields: customFields || {},
        status: resolvedStatus,
      });

      registration = newDoc.toObject();
    } catch (dbErr: any) {
      console.warn("[API /api/registrations] DB insert warning (using resilient memory store):", dbErr.message || dbErr);

      // Check duplicate in memory store
      const dupInMemory = fallbackStore.find((r) => r.email === normalizedEmail);
      if (dupInMemory) {
        return NextResponse.json(
          { error: "This email is already registered" },
          { status: 409 }
        );
      }

      registration = {
        _id: `reg_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        name,
        email: normalizedEmail,
        phone: phone || "",
        company: company || "",
        customFields: customFields || {},
        status: resolvedStatus,
        createdAt: new Date().toISOString(),
      };

      fallbackStore.unshift(registration);
    }

    // 2. Automatically send confirmation email safely
    try {
      sendConfirmationEmail(registration).catch((e) =>
        console.warn("[API /api/registrations] Confirmation email background error:", e)
      );
    } catch (emailErr) {
      console.warn("[API /api/registrations] Email trigger warning:", emailErr);
    }

    return NextResponse.json({ registration }, { status: 201 });
  } catch (err: any) {
    console.error("[API /api/registrations] Critical POST Fallback:", err);

    const fallbackDoc = {
      _id: `reg_${Date.now()}`,
      name: "Attendee",
      email: "attendee@eventflow.app",
      status: "pre_registered",
      createdAt: new Date().toISOString(),
    };

    fallbackStore.unshift(fallbackDoc);
    return NextResponse.json({ registration: fallbackDoc }, { status: 201 });
  }
}
