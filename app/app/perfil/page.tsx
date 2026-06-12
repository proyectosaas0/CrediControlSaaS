"use client";

import { useAuth } from "@/providers/auth-provider";
import { useAuthMe } from "@/hooks/queries/use-auth-me";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { LogOut, Mail } from "lucide-react";
import { es } from "@/lib/i18n/es";

export default function PerfilPage() {
  const { user, role, signOut } = useAuth();
  const { data: me } = useAuthMe();
  const nombre = me?.profile?.nombre_completo ?? user?.email ?? "Usuario";
  const initials = nombre.slice(0, 2).toUpperCase();

  return (
    <div className="mx-auto max-w-md space-y-5">
      <PageHeader eyebrow="Cuenta" title="Perfil" />

      <div
        className="dash-rise relative overflow-hidden rounded-2xl border border-border bg-card p-6 backdrop-blur-sm"
        style={{ animationDelay: "60ms" }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 0%, color-mix(in srgb, var(--primary) 10%, transparent), transparent 65%)",
          }}
        />
        <div className="relative flex flex-col items-center text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary to-violet-600 font-display text-2xl font-bold text-white shadow-lg shadow-primary/25 ring-4 ring-primary/15">
            {initials}
          </div>
          <p className="mt-4 max-w-full truncate font-display text-xl font-bold tracking-tight text-foreground">
            {nombre}
          </p>
          <p className="mt-1 flex max-w-full items-center gap-1.5 truncate text-sm text-muted-foreground">
            <Mail className="h-3.5 w-3.5 shrink-0" />
            {user?.email ?? "—"}
          </p>
          <Badge variant="primary" className="mt-3 capitalize">
            {role ?? "cobrador"}
          </Badge>
        </div>
      </div>

      <div className="dash-rise" style={{ animationDelay: "140ms" }}>
        <Button variant="outline" size="lg" className="w-full gap-2" onClick={signOut}>
          <LogOut className="h-4 w-4" />
          {es.auth.logout}
        </Button>
      </div>
    </div>
  );
}
