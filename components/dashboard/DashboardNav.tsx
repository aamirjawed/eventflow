"use client";

import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LogOut, Zap } from "lucide-react";
import { Logo } from "@/components/Logo";

export function DashboardNav() {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex h-14 items-center justify-between">
        <div className="flex items-center gap-2">
          <Logo size="sm" />
          <span className="text-muted-foreground text-xs hidden sm:block">/ Dashboard</span>
          <a
            href="/dashboard/printer"
            className="ml-3 text-xs font-bold text-slate-600 hover:text-blue-600 px-2.5 py-1 bg-slate-100 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <span>🖨️ Sunmi Printer</span>
          </a>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <span className="text-xs font-bold text-gray-900 dark:text-white">
              {session?.user?.email}
            </span>
            {session?.user?.email?.includes('rajsingh') || session?.user?.name?.includes('Dev') ? (
              <span className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-tighter">
                Dev Admin
              </span>
            ) : null}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="gap-1.5"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </Button>
        </div>
      </div>
    </header>
  );
}
