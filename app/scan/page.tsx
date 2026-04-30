import { Metadata } from "next";
import { QRScanner } from "@/components/dashboard/QRScanner";
import { ChevronLeft, QrCode } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/Logo";

export const metadata: Metadata = {
  title: "Check-in Scanner | EventFlow",
};

export default function ScanPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link 
            href="/dashboard" 
            className="p-3 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-2xl transition-all shadow-sm border border-gray-100 dark:border-gray-800"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div>
            <Logo size="md" />
            <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider mt-1 opacity-70">
              Mode: Admin Scanner
            </p>
          </div>
        </div>
        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <QrCode className="h-6 w-6 text-primary" />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-2xl shadow-primary/5 p-8 border border-primary/5">
        <QRScanner />
      </div>

      <div className="text-center">
        <p className="text-[10px] text-muted-foreground font-medium">
          Secure System • powered by TechfluenX
        </p>
      </div>
    </div>
  );
}
