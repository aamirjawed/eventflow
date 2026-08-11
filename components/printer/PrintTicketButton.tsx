"use client";

import React, { useState } from "react";
import { Button, ButtonProps } from "@/components/ui/button";
import { Printer, Loader2 } from "lucide-react";
import { TicketData, sunmiPrinter } from "@/lib/printer/sunmiPrinter";
import { ThermalTicket } from "./ThermalTicket";
import { ThermalPrinterConfig } from "@/lib/printer/printerConfig";

interface PrintTicketButtonProps extends ButtonProps {
  ticket: TicketData;
  config?: Partial<ThermalPrinterConfig>;
  label?: string;
  onBeforePrint?: () => Promise<void> | void;
  onAfterPrint?: () => void;
}

export const PrintTicketButton: React.FC<PrintTicketButtonProps> = ({
  ticket,
  config,
  label = "Print Ticket",
  onBeforePrint,
  onAfterPrint,
  className = "",
  variant = "default",
  size = "default",
  ...props
}) => {
  const [isPrinting, setIsPrinting] = useState(false);
  const [activeTicket, setActiveTicket] = useState<TicketData | null>(null);

  const handlePrint = async () => {
    try {
      setIsPrinting(true);
      setActiveTicket(ticket);

      if (onBeforePrint) {
        await onBeforePrint();
      }

      // Small delay to allow react to render ThermalTicket into DOM
      await new Promise((res) => setTimeout(res, 50));

      // Execute Sunmi thermal print directly (NO Play Store redirects)
      await sunmiPrinter.printTicket(ticket);

      setIsPrinting(false);
      if (onAfterPrint) onAfterPrint();
    } catch (err) {
      console.error("[SunmiPrinter] Print error:", err);
      setIsPrinting(false);
    }
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handlePrint}
        disabled={isPrinting}
        className={`gap-2 shadow-sm font-semibold ${className}`}
        {...props}
      >
        {isPrinting ? (
          <Loader2 className="h-4 w-4 animate-spin text-current" />
        ) : (
          <Printer className="h-4 w-4" />
        )}
        {isPrinting ? "Printing..." : label}
      </Button>

      {/* 58mm Thermal Ticket container for Chrome browser print */}
      {activeTicket && (
        <div className="hidden print:block fixed inset-0 bg-white z-[9999] p-0 m-0">
          <ThermalTicket ticket={activeTicket} config={config} isPrintOnly />
        </div>
      )}
    </>
  );
};
