import Link from "next/link";
import { BarChart3, Building2, CreditCard, TrendingUp } from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/tenants", label: "Tenants", icon: Building2 },
  { href: "/suscripciones", label: "Suscripciones", icon: CreditCard },
  { href: "/metricas", label: "Metricas", icon: TrendingUp },
] as const;

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full">
      <aside className="hidden w-64 flex-col border-r border-sidebar-border bg-sidebar-bg lg:flex">
        <div className="flex h-14 items-center border-b border-sidebar-border px-4">
          <span className="text-lg font-bold text-sidebar-foreground">
            SocioIA Admin
          </span>
        </div>
        <nav className="flex-1 overflow-y-auto p-3">
          <ul className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-border"
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 shrink-0 items-center gap-4 border-b border-white/[0.06] bg-background/70 backdrop-blur-xl px-4">
          <span className="text-sm font-medium text-muted-foreground">
            Panel Super Admin
          </span>
        </header>
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-5xl p-4 sm:p-6 lg:max-w-[1120px] lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
