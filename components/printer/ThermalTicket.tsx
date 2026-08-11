"use client";

import React from "react";
import { QRCodeSVG } from "qrcode.react";
import { ThermalPrinterConfig, DEFAULT_SUNMI_V2S_CONFIG } from "@/lib/printer/printerConfig";
import { TicketData } from "@/lib/printer/sunmiPrinter";

interface ThermalTicketProps {
  ticket: TicketData;
  config?: Partial<ThermalPrinterConfig>;
  className?: string;
  isPrintOnly?: boolean;
}

export const ThermalTicket: React.FC<ThermalTicketProps> = ({
  ticket,
  config: customConfig,
  className = "",
  isPrintOnly = false,
}) => {
  const config: ThermalPrinterConfig = {
    ...DEFAULT_SUNMI_V2S_CONFIG,
    ...customConfig,
  };

  const appName = ticket.eventName || process.env.NEXT_PUBLIC_APP_NAME || "EventFlow";
  const origin = typeof window !== "undefined" ? window.location.origin : (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000");
  const verifyUrl = ticket.verifyUrl || `${origin}/verify/${ticket.id}`;
  const formattedDate = ticket.eventDate || "August 11, 2026";

  const dividerClass = 
    config.dividerStyle === "dashed" ? "border-t-2 border-dashed border-black" :
    config.dividerStyle === "double" ? "border-t-4 border-double border-black" :
    config.dividerStyle === "dotted" ? "border-t-2 border-dotted border-black" :
    "border-t-2 border-solid border-black";

  return (
    <div
      className={`thermal-receipt-container text-black bg-white select-none ${
        isPrintOnly ? "hidden print:block" : ""
      } ${className}`}
      style={{
        width: config.paperWidth === "80mm" ? "76mm" : "54mm", // Safe thermal printable width
        fontFamily: config.fontFamily,
        letterSpacing: config.letterSpacing,
        margin: "0 auto",
        padding: "8px",
        color: "#000000",
        backgroundColor: "#ffffff",
      }}
    >
      {/* ─── HEADER SECTION ──────────────────────────────────────────────── */}
      <div className="text-center pb-2">
        <h1
          className="font-black tracking-tight uppercase"
          style={{ fontSize: config.titleFontSize, lineHeight: "1.2" }}
        >
          {appName}
        </h1>
        {config.headerSubtitle && (
          <p
            className="font-semibold uppercase tracking-wider"
            style={{ fontSize: config.footerFontSize }}
          >
            {config.headerSubtitle}
          </p>
        )}
      </div>

      <div className={`my-2 ${dividerClass}`} />

      {/* ─── TICKET & ATTENDEE DETAILS ────────────────────────────────────── */}
      <div className="py-1 space-y-2">
        <div>
          <span
            className="block uppercase font-bold text-slate-600"
            style={{ fontSize: config.footerFontSize }}
          >
            ATTENDEE NAME
          </span>
          <span
            className="block font-black uppercase tracking-tight break-words"
            style={{ fontSize: config.headerFontSize, lineHeight: "1.2" }}
          >
            {ticket.name}
          </span>
        </div>

        {ticket.ticketType && (
          <div className="flex justify-between items-baseline pt-1">
            <span className="font-bold text-slate-700" style={{ fontSize: config.bodyFontSize }}>
              PASS TYPE:
            </span>
            <span
              className="font-black uppercase px-1.5 py-0.5 border border-black rounded"
              style={{ fontSize: config.bodyFontSize }}
            >
              {ticket.ticketType}
            </span>
          </div>
        )}

        {ticket.company && (
          <div className="flex justify-between items-baseline">
            <span className="font-bold text-slate-700" style={{ fontSize: config.bodyFontSize }}>
              ORGANIZATION:
            </span>
            <span className="font-bold uppercase" style={{ fontSize: config.bodyFontSize }}>
              {ticket.company}
            </span>
          </div>
        )}

        {ticket.price !== undefined && (
          <div className="flex justify-between items-baseline">
            <span className="font-bold text-slate-700" style={{ fontSize: config.bodyFontSize }}>
              AMOUNT PAID:
            </span>
            <span className="font-black text-sm" style={{ fontSize: config.headerFontSize }}>
              ${ticket.price}
            </span>
          </div>
        )}

        <div className="pt-1">
          <span
            className="block uppercase font-bold text-slate-600"
            style={{ fontSize: config.footerFontSize }}
          >
            TICKET ID / REF
          </span>
          <span
            className="block font-mono font-bold tracking-widest text-center py-0.5 bg-slate-100 border border-slate-300 rounded"
            style={{ fontSize: config.bodyFontSize }}
          >
            {ticket.id}
          </span>
        </div>
      </div>

      <div className={`my-2 ${dividerClass}`} />

      {/* ─── QR CODE & SCAN INSTRUCTIONS ──────────────────────────────────── */}
      {config.showQRCode && (
        <div className="flex flex-col items-center justify-center py-2 text-center">
          <div className="p-2 bg-white border-2 border-black rounded-lg inline-block">
            <QRCodeSVG
              value={verifyUrl}
              size={config.qrCodeSize}
              level="M"
              includeMargin={false}
            />
          </div>
          <span
            className="mt-1 font-bold uppercase tracking-widest text-black"
            style={{ fontSize: config.footerFontSize }}
          >
            SCAN AT ENTRY GATE
          </span>
        </div>
      )}

      <div className={`my-2 ${dividerClass}`} />

      {/* ─── FOOTER SECTION ──────────────────────────────────────────────── */}
      <div className="text-center pt-1 space-y-1">
        <p
          className="font-medium leading-tight"
          style={{ fontSize: config.footerFontSize }}
        >
          {config.footerText}
        </p>

        {config.showTimestamp && (
          <p
            className="font-mono text-slate-600 uppercase pt-1"
            style={{ fontSize: "9px" }}
          >
            PRINTED: {formattedDate}
          </p>
        )}
      </div>

      {/* ─── SUNMI AUTO-CUT SPACING ───────────────────────────────────────── */}
      <div className="h-6 print:h-12" />
    </div>
  );
};
