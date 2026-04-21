"use client";

import { Button } from "@/components/ui/button";
import { QrCode, Beaker } from "lucide-react";
import Link from "next/link";

export function DashboardActions() {
  return (
    <div className="flex items-center gap-2">
      <Link href="/scan">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 shadow-sm hover:bg-primary hover:text-white transition-all"
        >
          <QrCode className="h-4 w-4" />
          Scan QR
        </Button>
      </Link>
      <Link href="/dashboard/test">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-muted-foreground hover:text-primary transition-all"
        >
          <Beaker className="h-4 w-4" />
          Simulator
        </Button>
      </Link>
    </div>
  );
}
