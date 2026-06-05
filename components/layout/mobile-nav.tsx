"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MapPin, Banknote, User } from "lucide-react";
import { cn } from "@/components/ui/cn";

const NAV_ITEMS = [
  { href: "/app", label: "Inicio", icon: Home },
  { href: "/app/ruta", label: "Ruta", icon: MapPin },
  { href: "/app/pagos", label: "Pagos", icon: Banknote },
  { href: "/app/perfil", label: "Perfil", icon: User },
] as const;

type MobileNavProps = {
  pendingCount?: number;
};

export function MobileNav({ pendingCount }: MobileNavProps) {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card lg:hidden">
      <ul className="flex h-16 items-center justify-around px-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/app"
              ? pathname === "/app"
              : pathname.startsWith(item.href);

          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={cn(
                  "relative flex flex-col items-center gap-0.5 py-1 text-xs font-medium transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span className="relative">
                  <Icon className="h-6 w-6" />
                  {item.href === "/app/ruta" && pendingCount !== undefined && pendingCount > 0 && (
                    <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
                      {pendingCount > 9 ? "9+" : pendingCount}
                    </span>
                  )}
                </span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
