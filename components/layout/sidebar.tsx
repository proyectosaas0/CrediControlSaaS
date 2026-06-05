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
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-sidebar-border bg-sidebar-bg transition-transform duration-200 lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-4">
          <Link
            href="/app"
            onClick={onClose}
            className="text-lg font-bold text-sidebar-foreground"
          >
            {orgName}
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-sidebar-foreground hover:bg-sidebar-border lg:hidden"
            aria-label="Cerrar menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3">
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
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-sidebar-active text-sidebar-active-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-border",
                    )}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-sidebar-border p-3">
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
      className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-foreground hover:bg-muted lg:hidden"
      aria-label="Abrir menu"
    >
      <Menu className="h-5 w-5" />
    </button>
  );
}
