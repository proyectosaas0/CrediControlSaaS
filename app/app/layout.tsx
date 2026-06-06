"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { RoleGate } from "@/components/layout/role-gate";
import { useAuth } from "@/providers/auth-provider";
import type { AppRole } from "@/lib/auth";
import { MOCK_ROUTE_ITEMS } from "@/lib/mock/ruta";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { role, user } = useAuth();

  const userName = user?.email?.slice(0, 2).toUpperCase() ?? "U";

  const pendingCount = MOCK_ROUTE_ITEMS.filter(
    (i) => i.estado === "pendiente" || i.estado === "mora" || i.estado === "parcial",
  ).length;

  return (
    <div className="flex h-full">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        role={(role as AppRole) ?? "admin"}
        userName={userName}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          onMenuClick={() => setSidebarOpen(true)}
          userName={userName}
        />

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-7xl p-4 pb-20 sm:p-6 lg:p-8 lg:pb-8">
            {children}
          </div>
        </main>

        <RoleGate allowed={["cobrador"]} role={role}>
          <MobileNav pendingCount={pendingCount} />
        </RoleGate>
      </div>
    </div>
  );
}
