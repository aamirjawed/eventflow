import { NextRequest, NextResponse } from "next/server";
import {
  getBackendRegistrationById,
  checkInBackendAttendee,
  deleteBackendRegistration,
} from "@/lib/backendApi";

export const dynamic = "force-dynamic";

/** GET /api/registrations/[id] */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const reg = await getBackendRegistrationById(params.id);
    if (!reg) return NextResponse.json({ error: "Registration not found" }, { status: 404 });
    return NextResponse.json({ registration: reg });
  } catch (err: any) {
    console.error("[API /api/registrations/[id]] GET Error:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch registration" }, { status: 500 });
  }
}

/** PATCH /api/registrations/[id] — check-in attendee */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();

    if (body.isCheckedIn || body.status === "checked_in") {
      const checkinRes = await checkInBackendAttendee(params.id);
      return NextResponse.json({ success: true, result: checkinRes });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[API /api/registrations/[id]] PATCH Error:", err);
    return NextResponse.json({ error: err.message || "Failed to check in attendee" }, { status: 500 });
  }
}

/** DELETE /api/registrations/[id] */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const res = await deleteBackendRegistration(params.id);
    return NextResponse.json({ success: true, result: res });
  } catch (err: any) {
    console.error("[API /api/registrations/[id]] DELETE Error:", err);
    return NextResponse.json({ error: err.message || "Failed to delete registration" }, { status: 500 });
  }
}
