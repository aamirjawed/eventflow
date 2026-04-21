import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Registration } from "@/models/Registration";

/** GET /api/admin/stats — Dashboard summary counts */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();

  const [total, preRegistered, registered, checkedIn] = await Promise.all([
    Registration.countDocuments(),
    Registration.countDocuments({ status: "pre_registered" }),
    Registration.countDocuments({ status: "registered" }),
    Registration.countDocuments({ status: "checked_in" }),
  ]);

  return NextResponse.json({ total, preRegistered, registered, checkedIn });
}
