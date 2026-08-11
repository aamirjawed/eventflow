"use client";

import React, { useState } from "react";
import { ThermalPrinterConfig, DEFAULT_SUNMI_V2S_CONFIG } from "@/lib/printer/printerConfig";
import { TicketData, sunmiPrinter } from "@/lib/printer/sunmiPrinter";
import { ThermalTicket } from "./ThermalTicket";
import { Button } from "@/components/ui/button";
import { Settings2, Printer, Check, RefreshCw, Type, Sliders, Layout } from "lucide-react";

interface ThermalPrinterCustomizerProps {
  sampleTicket?: TicketData;
  onConfigSave?: (newConfig: ThermalPrinterConfig) => void;
}

const DEMO_TICKET: TicketData = {
  id: "EVT-8942-X9",
  name: "Alex Morgan",
  email: "alex.morgan@example.com",
  ticketType: "VIP PASS",
  company: "TechCorp Inc.",
  eventName: "TECH SUMMIT 2026",
  eventDate: "2026-08-11 12:00 PM",
  price: "150.00",
  status: "CONFIRMED",
};

export const ThermalPrinterCustomizer: React.FC<ThermalPrinterCustomizerProps> = ({
  sampleTicket = DEMO_TICKET,
  onConfigSave,
}) => {
  const [mounted, setMounted] = useState(false);
  const [config, setConfig] = useState<ThermalPrinterConfig>(DEFAULT_SUNMI_V2S_CONFIG);
  const [activeTab, setActiveTab] = useState<"typography" | "layout" | "device">("typography");
  const [isSaved, setIsSaved] = useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-full max-w-5xl h-96 bg-white border border-slate-200 rounded-2xl animate-pulse" />
    );
  }

  const handleUpdate = <K extends keyof ThermalPrinterConfig>(
    key: K,
    value: ThermalPrinterConfig[K]
  ) => {
    const updated = { ...config, [key]: value };
    setConfig(updated);
    // config is local to this component only
    setIsSaved(false);
  };

  const handleSave = () => {
    if (onConfigSave) onConfigSave(config);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handlePrintTest = () => {
    sunmiPrinter.printTicket({
      id: "TEST-001",
      name: "Test Attendee",
      email: "test@eventflow.com",
      ticketType: "VIP Pass",
      company: "EventFlow QA",
      status: "registered",
    });
  };

  return (
    <div className="w-full max-w-5xl bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden">
      {/* Top Header */}
      <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <Settings2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-lg leading-tight">Sunmi V2s Plus Ticket Printer Configurator</h2>
            <p className="text-xs text-slate-400">Customize typography, dimensions & layout for thermal printing</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleSave}
            className="bg-white/10 text-white hover:bg-white/20 border-white/20 gap-2 text-xs"
          >
            {isSaved ? <Check className="h-4 w-4 text-emerald-400" /> : <RefreshCw className="h-4 w-4" />}
            {isSaved ? "Saved!" : "Save Defaults"}
          </Button>

          <Button
            onClick={handlePrintTest}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold gap-2 text-xs shadow-lg"
          >
            <Printer className="h-4 w-4" />
            Test Print on Sunmi
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[500px]">
        {/* Left Column: Controls (7 Cols) */}
        <div className="lg:col-span-7 p-6 border-r border-slate-100 flex flex-col justify-between">
          <div>
            {/* Tabs */}
            <div className="flex border-b border-slate-200 mb-6 gap-2">
              <button
                onClick={() => setActiveTab("typography")}
                className={`pb-3 px-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${
                  activeTab === "typography"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Type className="h-4 w-4" /> Typography & Fonts
              </button>
              <button
                onClick={() => setActiveTab("layout")}
                className={`pb-3 px-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${
                  activeTab === "layout"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Layout className="h-4 w-4" /> Receipt Layout
              </button>
              <button
                onClick={() => setActiveTab("device")}
                className={`pb-3 px-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${
                  activeTab === "device"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Sliders className="h-4 w-4" /> Device Settings
              </button>
            </div>

            {/* TAB 1: TYPOGRAPHY */}
            {activeTab === "typography" && (
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Font Family</label>
                  <select
                    value={config.fontFamily}
                    onChange={(e) => handleUpdate("fontFamily", e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                  >
                    <option value="'Courier New', Courier, monospace">Monospace (Courier New - Crisp Thermal standard)</option>
                    <option value="system-ui, -apple-system, sans-serif">Sans-Serif System Font</option>
                    <option value="'Inter', sans-serif">Inter (Modern Clean UI)</option>
                    <option value="'Roboto', sans-serif">Roboto</option>
                    <option value="Georgia, serif">Serif (Classic)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Title Font Size</label>
                    <select
                      value={config.titleFontSize}
                      onChange={(e) => handleUpdate("titleFontSize", e.target.value)}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                    >
                      <option value="16px">16px (Compact)</option>
                      <option value="18px">18px (Medium)</option>
                      <option value="20px">20px (Standard Large)</option>
                      <option value="24px">24px (Extra Large)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Attendee Name Size</label>
                    <select
                      value={config.headerFontSize}
                      onChange={(e) => handleUpdate("headerFontSize", e.target.value)}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                    >
                      <option value="12px">12px</option>
                      <option value="14px">14px (Standard)</option>
                      <option value="16px">16px (Prominent)</option>
                      <option value="18px">18px (Bold Accent)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Body Text Size</label>
                    <select
                      value={config.bodyFontSize}
                      onChange={(e) => handleUpdate("bodyFontSize", e.target.value)}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                    >
                      <option value="10px">10px</option>
                      <option value="11px">11px</option>
                      <option value="12px">12px (Standard)</option>
                      <option value="13px">13px</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Divider Style</label>
                    <select
                      value={config.dividerStyle}
                      onChange={(e) => handleUpdate("dividerStyle", e.target.value as ThermalPrinterConfig["dividerStyle"])}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                    >
                      <option value="dashed">Dashed Lines (- - -)</option>
                      <option value="solid">Solid Line (───)</option>
                      <option value="double">Double Line (═══)</option>
                      <option value="dotted">Dotted Line (• • •)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: RECEIPT LAYOUT */}
            {activeTab === "layout" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Header Title</label>
                  <input
                    type="text"
                    value={config.headerTitle}
                    onChange={(e) => handleUpdate("headerTitle", e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Header Subtitle</label>
                  <input
                    type="text"
                    value={config.headerSubtitle}
                    onChange={(e) => handleUpdate("headerSubtitle", e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Footer Notice</label>
                  <textarea
                    rows={2}
                    value={config.footerText}
                    onChange={(e) => handleUpdate("footerText", e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none resize-none"
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div>
                    <span className="block text-xs font-bold text-slate-800">Show Verification QR Code</span>
                    <span className="block text-[10px] text-slate-500">Scan at entrance for fast validation</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.showQRCode}
                    onChange={(e) => handleUpdate("showQRCode", e.target.checked)}
                    className="h-4 w-4 accent-blue-600 rounded"
                  />
                </div>
              </div>
            )}

            {/* TAB 3: DEVICE SETTINGS */}
            {activeTab === "device" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Paper Roll Width</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleUpdate("paperWidth", "80mm")}
                      className={`p-3 text-xs font-bold rounded-lg border text-center transition-all ${
                        config.paperWidth === "80mm"
                          ? "border-blue-600 bg-blue-50 text-blue-700"
                          : "border-slate-200 bg-slate-50 text-slate-600"
                      }`}
                    >
                      80mm Roll (Sunmi V2s Plus Standard)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdate("paperWidth", "58mm")}
                      className={`p-3 text-xs font-bold rounded-lg border text-center transition-all ${
                        config.paperWidth === "58mm"
                          ? "border-blue-600 bg-blue-50 text-blue-700"
                          : "border-slate-200 bg-slate-50 text-slate-600"
                      }`}
                    >
                      58mm Roll (Compact Handheld)
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs space-y-1">
                  <span className="font-bold">Sunmi V2s Plus Compatibility Notice:</span>
                  <p>
                    This configurator generates pure monochrome, high-contrast thermal layouts. 
                    The auto-cutter function will cut the paper after the ticket finishes printing on your Sunmi device.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="pt-6 border-t border-slate-100 flex items-center justify-between text-slate-400 text-[11px]">
            <span>Hardware Target: Sunmi V2s Plus Android Thermal</span>
            <span>Driver: Thermal CSS + WebPrint API</span>
          </div>
        </div>

        {/* Right Column: Real-time Live Thermal Preview (5 Cols) */}
        <div className="lg:col-span-5 bg-slate-100 p-6 flex flex-col items-center justify-center border-t lg:border-t-0">
          <div className="mb-2 text-center">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-200 px-3 py-1 rounded-full">
              Live Sunmi Print Preview
            </span>
          </div>

          {/* Simulated Thermal Ticket Container */}
          <div className="p-4 bg-white shadow-2xl rounded-sm border border-slate-300 transform transition-all duration-300">
            <ThermalTicket ticket={sampleTicket} config={config} />
          </div>

          <p className="mt-4 text-[11px] text-slate-400 text-center max-w-xs">
            What you see above is identical to the physical paper ticket printed on your Sunmi device.
          </p>
        </div>
      </div>
    </div>
  );
};
