"use client";

import { useState } from "react";
import { LogOut, ChevronDown } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { Avatar } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";

export function SuperAdminHeaderMenu() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { signOut, user } = useAuth();
  const userName = user?.nombreCompleto || user?.email || "Super Admin";

  async function handleLogout() {
    await signOut();
    setMenuOpen(false);
  }

  return (
    <div className="relative flex items-center gap-2">
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        aria-expanded={menuOpen}
        aria-label="Menu de usuario"
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
      >
        <span className="hidden text-sm text-muted-foreground sm:inline">
          {userName}
        </span>
        <Avatar initials={getInitials(userName)} size="sm" />
        <ChevronDown
          className={`h-3 w-3 text-muted-foreground transition-transform ${menuOpen ? "rotate-180" : ""}`}
        />
      </button>

      {menuOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
          <div className="absolute right-0 top-12 z-50 w-48 rounded-xl border border-border bg-card py-1 shadow-lg">
            <div className="border-b border-border px-4 py-2">
              <p className="text-sm font-medium text-foreground">{userName}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </button>
          </div>
        </>
      )}
    </div>
  );
}
