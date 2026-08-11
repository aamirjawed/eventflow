import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, name, email, company, ticketType, eventName } = body;

    if (!id || !name) {
      return NextResponse.json({ error: "Missing required ticket fields (id, name)" }, { status: 400 });
    }

    const appName = eventName || process.env.NEXT_PUBLIC_APP_NAME || "EventFlow";
    const origin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const verifyUrl = `${origin}/verify/${id}`;

    // 1. Generate 58mm plain text receipt for Sunmi OS Service
    const plainTextReceipt = 
      `================================\n` +
      `       ${appName.toUpperCase()}\n` +
      `    EVENT REGISTRATION PASS\n` +
      `================================\n\n` +
      `ATTENDEE:\n${name.toUpperCase()}\n` +
      `EMAIL: ${email || "N/A"}\n` +
      (ticketType ? `PASS TYPE: ${ticketType.toUpperCase()}\n` : '') +
      (company ? `ORG: ${company.toUpperCase()}\n` : '') +
      `--------------------------------\n` +
      `TICKET ID:\n${id}\n` +
      `--------------------------------\n` +
      `VERIFY LINK:\n${verifyUrl}\n` +
      `================================\n` +
      `Printed: ${new Date().toLocaleString()}\n` +
      `\n\n\n\n\n`;

    // 2. Generate ESC/POS Binary Bytes
    const encoder = new TextEncoder();
    const escPosBytes = Array.from(encoder.encode(plainTextReceipt));

    return NextResponse.json({
      success: true,
      jobId: `PRINT-${Date.now()}`,
      ticket: { id, name, email, company, ticketType },
      plainTextReceipt,
      escPosBase64: Buffer.from(escPosBytes).toString("base64"),
      intentUri: `intent:base64,${Buffer.from(escPosBytes).toString("base64")}#Intent;scheme=rawbt;S.browser_fallback_url=;end;`
    });
  } catch (error: any) {
    console.error("[API/Print Error]:", error);
    return NextResponse.json({ error: error.message || "Failed to process print job" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: "online",
    supportedPrinters: ["Sunmi V2s", "Sunmi V2s Plus", "Sunmi V2", "Generic 58mm Thermal"],
    supportedProtocols: ["Sunmi Bridge JS", "Web Bluetooth GATT", "Local ESC/POS WebSocket", "RawBT Intent"]
  });
}
