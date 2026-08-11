"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { RoleGate } from "@/components/layout/role-gate";
import { useAuth } from "@/providers/auth-provider";
import type { AppRole } from "@/lib/auth";
import { useRutaHoy } from "@/hooks/queries/use-ruta";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { role, user } = useAuth();

  const userName = user?.nombreCompleto || user?.email?.split("@")[0] || "Usuario";

  const { data: rutaItems } = useRutaHoy(undefined, { enabled: role === "cobrador" });
  const pendingCount =
    rutaItems?.filter(
      (i) => i.estado === "pendiente" || i.estado === "mora" || i.estado === "parcial",
    ).length ?? 0;

  return (
    <div className="flex h-screen">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        role={(role as AppRole) ?? "admin"}
        userName={userName}
      />

      <div className="flex flex-1 flex-col overflow-hidden lg:pl-0">
        <Header
          onMenuClick={() => setSidebarOpen(true)}
          userName={userName}
        />

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-5xl p-4 pb-20 sm:p-6 lg:max-w-[1120px] lg:p-8 lg:pb-8">
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
