"use client";

import { useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { SidebarTrigger } from "./sidebar";
import { useAuth } from "@/providers/auth-provider";
import { LogOut, ChevronDown } from "lucide-react";

type HeaderProps = {
  onMenuClick: () => void;
  userName?: string;
};

export function Header({ onMenuClick, userName = "Usuario" }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    setMenuOpen(false);
  };

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background/80 backdrop-blur-md px-4">
      <SidebarTrigger onClick={onMenuClick} />
      <div className="flex-1" />
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
          <Avatar initials={userName.slice(0, 2).toUpperCase()} size="sm" />
          <ChevronDown className={`hidden h-3 w-3 text-muted-foreground transition-transform sm:block ${menuOpen ? "rotate-180" : ""}`} />
        </button>

        {menuOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setMenuOpen(false)}
            />
            <div className="absolute right-0 top-12 z-50 w-48 rounded-xl border border-border bg-card py-1 shadow-lg">
              <div className="border-b border-border px-4 py-2">
                <p className="text-sm font-medium text-foreground">{userName}</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <LogOut className="h-4 w-4" />
                Cerrar sesion
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
