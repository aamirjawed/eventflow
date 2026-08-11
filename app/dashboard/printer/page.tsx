import { Metadata } from "next";
import { ThermalPrinterCustomizer } from "@/components/printer/ThermalPrinterCustomizer";
import { PrinterConnectionBadge } from "@/components/printer/PrinterConnectionBadge";

export const metadata: Metadata = {
  title: "Sunmi Thermal Printer Settings | EventFlow",
};

export default function SunmiPrinterPage() {
  return (
    <div className="p-6 md:p-10 bg-slate-50 min-h-screen flex flex-col items-center justify-center">
      <div className="w-full max-w-5xl mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Sunmi V2s Plus Hardware Settings</h1>
          <p className="text-slate-500 text-sm">
            Customize font styles, sizes, line dividers, and receipt formatting for your handheld Sunmi POS terminal.
          </p>
        </div>
        <PrinterConnectionBadge />
      </div>

      <ThermalPrinterCustomizer />
    </div>
  );
}
