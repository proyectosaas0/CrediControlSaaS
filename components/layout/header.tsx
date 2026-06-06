"use client";

import { useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { SidebarTrigger } from "./sidebar";
import { useAuth } from "@/providers/auth-provider";
import { LogOut } from "lucide-react";

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
    <header className="flex h-14 items-center gap-3 border-b border-border bg-card px-4">
      <SidebarTrigger onClick={onMenuClick} />
      <div className="flex-1" />
      <div className="relative flex items-center gap-2">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          aria-expanded={menuOpen}
          aria-label="Menu de usuario"
          className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
        >
          <span className="hidden text-sm text-muted-foreground sm:inline">
            {userName}
          </span>
          <Avatar initials={userName.slice(0, 2).toUpperCase()} size="sm" />
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-12 w-48 rounded-lg border border-border bg-card shadow-lg z-50">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted rounded-lg transition-colors first:rounded-t-lg last:rounded-b-lg"
            >
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
