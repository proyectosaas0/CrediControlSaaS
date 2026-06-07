"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Users,
  FileText,
  MapPin,
  Banknote,
  AlertTriangle,
  Building2,
  BarChart3,
  UserCircle,
  Settings,
  Menu,
  X,
  UsersRound,
} from "lucide-react";
import { cn } from "@/components/ui/cn";
import { Avatar } from "@/components/ui/avatar";
import type { AppRole } from "@/lib/auth";

const ADMIN_ITEMS = [
  { href: "/app", label: "Inicio", icon: Home },
  { href: "/app/clientes", label: "Clientes", icon: Users },
  { href: "/app/prestamos", label: "Prestamos", icon: FileText },
  { href: "/app/ruta", label: "Ruta del dia", icon: MapPin },
  { href: "/app/pagos", label: "Pagos", icon: Banknote },
  { href: "/app/mora", label: "Mora", icon: AlertTriangle },
  { href: "/app/caja", label: "Caja", icon: Building2 },
  { href: "/app/reportes", label: "Reportes", icon: BarChart3 },
  { href: "/app/cobradores", label: "Cobradores", icon: UserCircle },
  { href: "/app/usuarios", label: "Usuarios", icon: UsersRound },
  { href: "/app/configuracion", label: "Configuracion", icon: Settings },
] as const;

const COBRADOR_ITEMS = [
  { href: "/app", label: "Inicio", icon: Home },
  { href: "/app/ruta", label: "Mi ruta", icon: MapPin },
  { href: "/app/pagos", label: "Mis pagos", icon: Banknote },
  { href: "/app/perfil", label: "Perfil", icon: UserCircle },
] as const;

type SidebarProps = {
  open: boolean;
  onClose: () => void;
  role: AppRole;
  userName?: string;
  orgName?: string;
};

export function Sidebar({ open, onClose, role, userName = "Usuario", orgName = "CrediControl" }: SidebarProps) {
  const pathname = usePathname();
  const items = role === "cobrador" ? COBRADOR_ITEMS : ADMIN_ITEMS;

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-sidebar-border bg-sidebar-bg transition-transform duration-300 lg:static lg:w-60 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Brand */}
        <div className="flex h-14 shrink-0 items-center gap-3 border-b border-sidebar-border px-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <span className="text-sm font-bold text-primary-foreground">C</span>
          </div>
          <Link
            href="/app"
            onClick={onClose}
            className="text-base font-semibold tracking-tight text-sidebar-foreground"
          >
            {orgName}
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="ml-auto inline-flex min-h-8 min-w-8 items-center justify-center rounded-md text-sidebar-foreground hover:bg-sidebar-border lg:hidden"
            aria-label="Cerrar menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            {items.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/app"
                  ? pathname === "/app"
                  : pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
                      isActive
                        ? "bg-primary/10 text-primary shadow-[0_0_8px_-3px_rgba(99,102,241,0.3)] ring-1 ring-primary/10"
                        : "text-sidebar-foreground hover:bg-white/[0.04] hover:text-foreground",
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0 transition-colors",
                        isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground",
                      )}
                    />
                    {item.label}
                    {isActive && (
                      <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="shrink-0 border-t border-sidebar-border px-3 py-3">
          <div className="flex items-center gap-3 rounded-lg px-3 py-2">
            <Avatar initials={userName.slice(0, 2).toUpperCase()} size="sm" />
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium text-sidebar-foreground">
                {userName}
              </p>
              <p className="truncate text-xs text-muted-foreground capitalize">
                {role.replace("_", " ")}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

export function SidebarTrigger({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg text-foreground hover:bg-muted lg:hidden"
      aria-label="Abrir menu"
    >
      <Menu className="h-5 w-5" />
    </button>
  );
}
