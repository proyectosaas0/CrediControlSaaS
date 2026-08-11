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
import { getInitials } from "@/lib/utils";
import type { AppRole } from "@/lib/auth";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
};

type NavGroup = {
  label?: string;
  items: NavItem[];
};

const ADMIN_GROUPS: NavGroup[] = [
  {
    items: [{ href: "/app", label: "Inicio", icon: Home }],
  },
  {
    label: "Operaciones",
    items: [
      { href: "/app/clientes", label: "Clientes", icon: Users },
      { href: "/app/prestamos", label: "Préstamos", icon: FileText },
      { href: "/app/ruta", label: "Ruta del día", icon: MapPin },
      { href: "/app/pagos", label: "Pagos", icon: Banknote },
      { href: "/app/mora", label: "Mora", icon: AlertTriangle },
    ],
  },
  {
    label: "Finanzas",
    items: [
      { href: "/app/caja", label: "Caja", icon: Building2 },
      { href: "/app/reportes", label: "Reportes", icon: BarChart3 },
    ],
  },
  {
    label: "Equipo",
    items: [
      { href: "/app/cobradores", label: "Cobradores", icon: UserCircle },
      { href: "/app/usuarios", label: "Usuarios", icon: UsersRound },
      { href: "/app/configuracion", label: "Configuración", icon: Settings },
    ],
  },
];

const COBRADOR_GROUPS: NavGroup[] = [
  {
    items: [
      { href: "/app", label: "Inicio", icon: Home },
      { href: "/app/ruta", label: "Mi ruta", icon: MapPin },
      { href: "/app/clientes", label: "Clientes", icon: Users },
      { href: "/app/pagos", label: "Mis pagos", icon: Banknote },
      { href: "/app/mora", label: "Mora", icon: AlertTriangle },
      { href: "/app/perfil", label: "Perfil", icon: UserCircle },
    ],
  },
];

const ROLE_LABELS: Record<AppRole, string> = {
  super_admin: "Super Admin",
  admin: "Administrador",
  cobrador: "Cobrador",
};

const ROLE_BADGE: Record<AppRole, string> = {
  super_admin: "bg-warning/15 text-warning",
  admin: "bg-primary/15 text-primary",
  cobrador: "bg-success/15 text-success",
};

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
  const groups = role === "cobrador" ? COBRADOR_GROUPS : ADMIN_GROUPS;
  const initials = getInitials(userName);

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
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-sidebar-border transition-transform duration-300 ease-out lg:static lg:w-[224px] lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
        style={{
          background:
            "radial-gradient(ellipse 140% 35% at 50% 0%, rgba(99,102,241,0.10) 0%, transparent 65%), var(--sidebar-bg)",
        }}
      >
        {/* Brand */}
        <div className="relative flex h-16 shrink-0 items-center gap-3 px-5 lg:h-14 lg:px-4">
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-sidebar-border to-transparent" />

          <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-violet-600 shadow-lg shadow-primary/25 lg:h-8 lg:w-8 lg:rounded-lg">
            <div className="absolute inset-0 rounded-xl bg-white/10 lg:rounded-lg" />
            <Zap
              className="relative h-4 w-4 text-white lg:h-3.5 lg:w-3.5"
              strokeWidth={2.5}
            />
          </div>

          <div className="flex-1 min-w-0">
            <Link href="/app" onClick={onClose} className="group block">
              <p className="text-sm font-bold tracking-tight text-foreground leading-none mb-0.5 transition-colors duration-150 group-hover:text-primary lg:text-[13px]">
                {orgName}
              </p>
              <p className="text-[10px] font-semibold tracking-[0.10em] uppercase text-muted-foreground/70">
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
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-3.5 lg:px-2.5 lg:py-2.5 lg:space-y-3">
          {groups.map((group, groupIdx) => (
            <div key={groupIdx}>
              {group.label && (
                <p className="mb-1 px-2.5 text-[10px] font-semibold tracking-[0.09em] uppercase text-muted-foreground/50 lg:px-2">
                  {group.label}
                </p>
              )}
              <ul className="space-y-px">
                {group.items.map((item) => {
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
                          "group relative flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition-all duration-150 lg:gap-2 lg:px-2",
                          isActive
                            ? "bg-gradient-to-r from-primary/[0.15] to-primary/[0.04] text-primary"
                            : "text-sidebar-foreground hover:bg-sidebar-border hover:text-foreground",
                        )}
                      >
                        {isActive && (
                          <span
                            className="absolute inset-y-1.5 left-0 w-[2px] rounded-r-full bg-primary"
                            style={{
                              boxShadow: "0 0 8px rgba(129,140,248,0.55)",
                            }}
                          />
                        )}

                        <span
                          className={cn(
                            "flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-md transition-all duration-150 lg:h-5 lg:w-5",
                            isActive
                              ? "bg-primary/15"
                              : "group-hover:bg-white/[0.05]",
                          )}
                        >
                          <Icon
                            className={cn(
                              "h-3.5 w-3.5 shrink-0 transition-colors lg:h-3 lg:w-3",
                              isActive
                                ? "text-primary"
                                : "text-muted-foreground group-hover:text-foreground",
                            )}
                            strokeWidth={isActive ? 2.5 : 2}
                          />
                        </span>

                        <span className="flex-1 leading-none">{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="shrink-0 px-3 pb-3 pt-2 lg:px-2.5 lg:pb-2.5">
          <div className="relative overflow-hidden rounded-xl border border-sidebar-border/50 bg-sidebar-border/25 px-3 py-2.5">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/[0.05] to-transparent" />
            <div className="relative flex items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-violet-600 text-[11px] font-bold text-white ring-2 ring-primary/20">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold text-foreground leading-tight">
                  {userName}
                </p>
                <span
                  className={cn(
                    "mt-0.5 inline-flex items-center rounded-full px-1.5 text-[10px] font-semibold leading-[1.6]",
                    ROLE_BADGE[role as AppRole] ?? "bg-primary/15 text-primary",
                  )}
                >
                  {ROLE_LABELS[role as AppRole] ?? role}
                </span>
              </div>
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
