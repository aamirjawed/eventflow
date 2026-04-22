"use client";

import { useSession } from "next-auth/react";
import useSWR from "swr";
import { Card, CardContent, Skeleton } from "@/components/ui/index";
import { Users, UserCheck, UserPlus, QrCode } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface Stats {
  total: number;
  preRegistered: number;
  registered: number;
  checkedIn: number;
}

export function StatsCards() {
  const { status } = useSession();
  const { data, isLoading } = useSWR<Stats>(status === "authenticated" ? "/api/admin/stats" : null, fetcher, {
    refreshInterval: 10000, // Refresh every 10s for real-time feel
  });

  const cards = [
    {
      label: "Total Registrations",
      value: data?.total ?? 0,
      icon: Users,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-900/20",
    },
    {
      label: "Pre-registered",
      value: data?.preRegistered ?? 0,
      icon: UserPlus,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-900/20",
    },
    {
      label: "On-site Registered",
      value: data?.registered ?? 0,
      icon: UserCheck,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-900/20",
    },
    {
      label: "Checked In",
      value: data?.checkedIn ?? 0,
      icon: QrCode,
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-50 dark:bg-purple-900/20",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.label}>
            <CardContent className="p-5">
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ) : (
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-3xl font-bold tabular-nums">{card.value}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">{card.label}</p>
                  </div>
                  <div className={`p-2 rounded-lg ${card.bg}`}>
                    <Icon className={`h-5 w-5 ${card.color}`} />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
