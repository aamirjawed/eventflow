"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Loader2, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BadgeData {
  id: string;
  name: string;
  email: string;
  company: string;
  status: string;
}

export function BadgePrintClient({ id }: { id: string }) {
  const [data, setData] = useState<BadgeData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/badge/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setData(d);
        // Auto-print after a brief render delay
        setTimeout(() => window.print(), 600);
      })
      .catch((e) => setError(e.message));
  }, [id]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const appName = process.env.NEXT_PUBLIC_APP_NAME || "EventFlow";
  const badgeUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/verify/${id}`;

  return (
    <>
      {/* Screen-only controls */}
      <div className="print:hidden fixed top-4 right-4 z-10">
        <Button onClick={() => window.print()} className="gap-2 shadow-lg">
          <Printer className="h-4 w-4" />
          Print Badge
        </Button>
      </div>

      {/* Screen preview wrapper */}
      <div className="print:hidden min-h-screen bg-gray-100 flex flex-col items-center justify-center gap-6 p-8">
        <p className="text-sm text-muted-foreground">Badge preview — will auto-print</p>
        <BadgeCard data={data} appName={appName} badgeUrl={badgeUrl} />
      </div>

      {/* Print area — visible only when printing */}
      <div id="badge-print-area" className="hidden print:block">
        <BadgeCard data={data} appName={appName} badgeUrl={badgeUrl} print />
      </div>

      {/* Minimal print CSS injected inline for speed */}
      <style>{`
        @media print {
          html, body { margin: 0; padding: 0; }
          @page { size: 3.375in 2.125in; margin: 0; }
        }
      `}</style>
    </>
  );
}

function BadgeCard({
  data,
  appName,
  badgeUrl,
  print = false,
}: {
  data: BadgeData;
  appName: string;
  badgeUrl: string;
  print?: boolean;
}) {
  // Credit-card size: 3.375 × 2.125 inches = 324 × 204px at 96dpi
  const style = print
    ? {
        width: "3.375in",
        height: "2.125in",
        fontFamily: "sans-serif",
      }
    : {};

  return (
    <div
      style={style}
      className={
        print
          ? "bg-white flex flex-col"
          : "w-[324px] h-[204px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border"
      }
    >
      {/* Top accent bar */}
      <div className="h-2 bg-blue-600 flex-shrink-0" />

      <div className="flex flex-1 items-center px-4 gap-3 overflow-hidden">
        {/* Left: name + company */}
        <div className="flex-1 min-w-0">
          {/* Event name */}
          <p
            className="text-blue-600 font-bold uppercase tracking-widest"
            style={{ fontSize: "7px", marginBottom: "4px" }}
          >
            {appName}
          </p>

          {/* Attendee name */}
          <p
            className="font-black text-gray-900 leading-tight"
            style={{
              fontSize: data.name.length > 18 ? "16px" : "20px",
              lineHeight: 1.1,
              wordBreak: "break-word",
            }}
          >
            {data.name}
          </p>

          {/* Company */}
          {data.company && (
            <p
              className="text-gray-500 mt-1 truncate"
              style={{ fontSize: "10px" }}
            >
              {data.company}
            </p>
          )}

          {/* Status badge */}
          <span
            className={`inline-block mt-2 px-2 py-0.5 rounded-full text-white font-semibold uppercase tracking-wide ${
              data.status === "checked_in"
                ? "bg-emerald-500"
                : data.status === "registered"
                ? "bg-blue-500"
                : "bg-amber-500"
            }`}
            style={{ fontSize: "7px" }}
          >
            {data.status === "checked_in"
              ? "Checked In"
              : data.status === "registered"
              ? "On-site"
              : "Pre-registered"}
          </span>
        </div>

        {/* Right: QR code */}
        <div className="flex-shrink-0">
          <QRCodeSVG
            value={badgeUrl}
            size={72}
            level="M"
            includeMargin={false}
          />
          <p
            className="text-center text-gray-400 mt-1"
            style={{ fontSize: "6px" }}
          >
            Scan to verify
          </p>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="h-1.5 bg-gray-100 flex-shrink-0" />
    </div>
  );
}
