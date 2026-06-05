"use client";

import { Avatar } from "@/components/ui/avatar";
import { SidebarTrigger } from "./sidebar";

type HeaderProps = {
  onMenuClick: () => void;
  userName?: string;
};

export function Header({ onMenuClick, userName = "Usuario" }: HeaderProps) {
  return (
    <header className="flex h-14 items-center gap-3 border-b border-border bg-card px-4">
      <SidebarTrigger onClick={onMenuClick} />
      <div className="flex-1" />
      <div className="flex items-center gap-2">
        <span className="hidden text-sm text-muted-foreground sm:inline">
          {userName}
        </span>
        <Avatar initials={userName.slice(0, 2).toUpperCase()} size="sm" />
      </div>
    </header>
  );
}
