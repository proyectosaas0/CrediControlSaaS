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
  X,
  UsersRound,
  Menu,
  Zap,
} from "lucide-react";
import { cn } from "@/components/ui/cn";
import type { AppRole } from "@/lib/auth";

const ADMIN_ITEMS = [
  { href: "/app", label: "Inicio", icon: Home },
  { href: "/app/clientes", label: "Clientes", icon: Users },
  { href: "/app/prestamos", label: "Préstamos", icon: FileText },
  { href: "/app/ruta", label: "Ruta del día", icon: MapPin },
  { href: "/app/pagos", label: "Pagos", icon: Banknote },
  { href: "/app/mora", label: "Mora", icon: AlertTriangle },
  { href: "/app/caja", label: "Caja", icon: Building2 },
  { href: "/app/reportes", label: "Reportes", icon: BarChart3 },
  { href: "/app/cobradores", label: "Cobradores", icon: UserCircle },
  { href: "/app/usuarios", label: "Usuarios", icon: UsersRound },
  { href: "/app/configuracion", label: "Configuración", icon: Settings },
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

export function Sidebar({
  open,
  onClose,
  role,
  userName = "Usuario",
  orgName = "CrediControl",
}: SidebarProps) {
  const pathname = usePathname();
  const items = role === "cobrador" ? COBRADOR_ITEMS : ADMIN_ITEMS;

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-sidebar-border bg-sidebar-bg transition-transform duration-300 ease-out lg:static lg:w-[224px] lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Brand */}
        <div className="relative flex h-16 shrink-0 items-center gap-3 border-b border-sidebar-border px-5 lg:h-14 lg:px-4">
          {/* Subtle gradient top accent */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

          <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-violet-600 shadow-lg shadow-primary/30 lg:h-8 lg:w-8 lg:rounded-lg">
            <Zap className="h-4 w-4 text-white lg:h-3.5 lg:w-3.5" strokeWidth={2.5} />
          </div>

          <div className="flex-1 min-w-0">
            <Link
              href="/app"
              onClick={onClose}
              className="block"
            >
              <p className="text-sm font-bold tracking-tight text-foreground leading-none mb-0.5 lg:text-[13px]">
                {orgName}
              </p>
              <p className="text-[10px] font-medium text-muted-foreground tracking-wide">
                Cobranza digital
              </p>
            </Link>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-sidebar-border hover:text-foreground transition-colors lg:hidden"
            aria-label="Cerrar menú"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 lg:px-2.5 lg:py-3">
          <ul className="space-y-0.5 lg:space-y-px">
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
                      "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 lg:gap-2.5 lg:px-2.5 lg:py-1.5 lg:text-[13px]",
                      isActive
                        ? "bg-primary/[0.12] text-primary"
                        : "text-sidebar-foreground hover:bg-sidebar-border hover:text-foreground",
                    )}
                  >
                    {/* Active left indicator */}
                    {isActive && (
                      <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r-full bg-primary" />
                    )}

                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0 transition-colors",
                        isActive
                          ? "text-primary"
                          : "text-muted-foreground group-hover:text-foreground",
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
        <div className="shrink-0 border-t border-sidebar-border px-3 py-3 lg:px-2.5 lg:py-2.5">
          <div className="flex items-center gap-3 rounded-lg px-2.5 py-2 lg:gap-2.5 lg:px-2 lg:py-1.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/60 to-violet-600/60 text-xs font-bold text-white ring-2 ring-primary/20">
              {userName.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-semibold text-foreground lg:text-[13px]">
                {userName}
              </p>
              <p className="truncate text-xs text-muted-foreground capitalize lg:text-[11px]">
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
      className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-lg text-foreground hover:bg-muted transition-colors lg:hidden"
      aria-label="Abrir menú"
    >
      <Menu className="h-5 w-5" />
    </button>
  );
}
