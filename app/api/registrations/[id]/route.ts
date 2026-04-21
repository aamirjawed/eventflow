import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Registration } from "@/models/Registration";

/** GET /api/registrations/[id] */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const reg = await Registration.findById(params.id).lean();
  if (!reg) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ registration: reg });
}

/** PATCH /api/registrations/[id] — update status or fields */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();

  const body = await req.json();
  const updates: Record<string, unknown> = {};

  if (body.status) updates.status = body.status;
  
  if (body.isCheckedIn !== undefined) {
    updates.isCheckedIn = body.isCheckedIn;
    if (body.isCheckedIn) {
      updates.checkedInAt = new Date();
    }
  }

  if (body.name) updates.name = body.name;
  if (body.phone) updates.phone = body.phone;
  if (body.company) updates.company = body.company;
  if (body.customFields) updates.customFields = body.customFields;

  const reg = await Registration.findByIdAndUpdate(
    params.id,
    { $set: updates },
    { new: true }
  ).lean();

  if (!reg) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ registration: reg });
}

/** DELETE /api/registrations/[id] */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  await Registration.findByIdAndDelete(params.id);

  return NextResponse.json({ success: true });
}
