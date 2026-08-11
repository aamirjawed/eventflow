"use client";

import React, { useEffect, useState } from "react";
import { sunmiPrinter, PrinterConnectionState } from "@/lib/printer/sunmiPrinter";
import { Printer, CheckCircle2, Bluetooth, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export const PrinterConnectionBadge: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const [conn, setConn] = useState<PrinterConnectionState>({
    status: "disconnected",
    deviceName: null,
    method: null,
  });
  const [connecting, setConnecting] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<"idle" | "ok" | "fail">("idle");

  useEffect(() => {
    setMounted(true);
    setConn(sunmiPrinter.getState());
    return sunmiPrinter.subscribe(setConn);
  }, []);

  const handleConnect = async () => {
    if (connecting) {
      // Force cancel if user taps again while connecting
      setConnecting(false);
      return;
    }

    setConnecting(true);

    // Safety fallback: force reset spinner after 10 seconds max
    const forceResetTimer = setTimeout(() => {
      setConnecting(false);
    }, 10000);

    try {
      await sunmiPrinter.connectBluetooth();
    } catch (err) {
      console.error("[PrinterConnectionBadge] Connection error:", err);
    } finally {
      clearTimeout(forceResetTimer);
      setConnecting(false);
    }
  };

  const handleTestPrint = async () => {
    setTesting(true);
    setTestResult("idle");
    try {
      await sunmiPrinter.printTicket({
        id: "TEST-001",
        name: "Test Attendee",
        email: "test@eventflow.com",
        ticketType: "VIP Pass",
        company: "EventFlow",
        status: "registered",
      });
      setTestResult("ok");
    } catch {
      setTestResult("fail");
    } finally {
      setTesting(false);
      setTimeout(() => setTestResult("idle"), 3000);
    }
  };

  // Prevent SSR Hydration mismatch
  if (!mounted) {
    return (
      <div className="h-8 w-32 bg-slate-900/50 animate-pulse rounded-xl" />
    );
  }

  // Connected via Bluetooth GATT or Native SDK Bridge
  if (conn.status === "connected") {
    const label =
      conn.method === "bridge"
        ? "Sunmi Bridge Ready"
        : conn.deviceName
        ? `Connected (${conn.deviceName})`
        : "Printer Connected";

    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-950 border border-emerald-800 rounded-xl text-emerald-300 shadow-sm">
        <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-400" />
        <span className="text-xs font-semibold">{label}</span>
        <Button
          size="sm"
          onClick={handleTestPrint}
          disabled={testing}
          className="h-7 text-xs bg-emerald-800 hover:bg-emerald-700 text-emerald-100 border-0 ml-1 gap-1"
        >
          {testing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Printer className="h-3 w-3" />}
          {testResult === "ok" ? "Printed!" : testResult === "fail" ? "Failed" : testing ? "..." : "Test"}
        </Button>
      </div>
    );
  }

  // Bluetooth Disconnected — show prominent Connect Printer button
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 shadow-sm">
      <Bluetooth className="h-4 w-4 flex-shrink-0 text-blue-400" />
      <span className="text-xs font-medium text-slate-300">Thermal Printer</span>
      <Button
        size="sm"
        onClick={handleConnect}
        className="h-7 text-xs bg-blue-600 hover:bg-blue-500 text-white font-medium border-0 ml-1 gap-1 shadow"
      >
        {connecting ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Bluetooth className="h-3.5 w-3.5" />
        )}
        {connecting ? "Cancel" : "Connect Printer"}
      </Button>
    </div>
  );
};
