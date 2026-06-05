"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { RoleGate } from "@/components/layout/role-gate";
import { useAuth } from "@/providers/auth-provider";
import type { AppRole } from "@/lib/auth";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { role, user } = useAuth();

  const userName = user?.email?.slice(0, 2).toUpperCase() ?? "U";

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

        <main className="flex-1 overflow-y-auto p-4 pb-20 lg:p-6 lg:pb-6">
          {children}
        </main>

        <RoleGate allowed={["cobrador"]} role={role}>
          <MobileNav />
        </RoleGate>
      </div>
    </div>
  );
}
