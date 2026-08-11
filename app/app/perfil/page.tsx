"use client";

import { useAuth } from "@/providers/auth-provider";
import { useAuthMe } from "@/hooks/queries/use-auth-me";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PageHeader, SectionHead } from "@/components/ui/page-header";
import { LogOut, Mail, Phone, Building2, Clock } from "lucide-react";
import { es } from "@/lib/i18n/es";

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Administrador",
  cobrador: "Cobrador",
};

export default function PerfilPage() {
  const { user, role, signOut } = useAuth();
  const { data: me } = useAuthMe();
  const nombre = me?.profile?.nombre_completo ?? user?.email ?? "Usuario";
  const initials = nombre.slice(0, 2).toUpperCase();

  const ultimoAcceso = me?.profile?.ultimo_acceso
    ? new Date(me.profile.ultimo_acceso).toLocaleDateString("es-CO", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

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
            {ROLE_LABELS[role ?? "cobrador"] ?? role}
          </Badge>
        </div>
      </div>

      <div className="dash-rise" style={{ animationDelay: "100ms" }}>
        <SectionHead title="Información" />
        <Card padding="md" className="p-5">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm">
            <div className="col-span-2 flex items-start gap-2.5">
              <Phone className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <dt className="text-xs text-muted-foreground">Teléfono</dt>
                <dd className="mt-0.5 truncate font-medium text-foreground">
                  {me?.profile?.telefono ?? "—"}
                </dd>
              </div>
            </div>
            <div className="col-span-2 flex items-start gap-2.5">
              <Building2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <dt className="text-xs text-muted-foreground">Organización</dt>
                <dd className="mt-0.5 truncate font-medium text-foreground">
                  {me?.organization?.nombre_negocio ?? "—"}
                </dd>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <dt className="text-xs text-muted-foreground">Último acceso</dt>
                <dd className="mt-0.5 truncate font-medium tabular-nums text-foreground">
                  {ultimoAcceso}
                </dd>
              </div>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Estado</dt>
              <dd className="mt-0.5">
                <Badge variant={me?.profile?.activo ?? true ? "success" : "muted"}>
                  {me?.profile?.activo ?? true ? "Activo" : "Inactivo"}
                </Badge>
              </dd>
            </div>
          </dl>
        </Card>
      </div>

      <div className="dash-rise" style={{ animationDelay: "160ms" }}>
        <Button variant="outline" size="lg" className="w-full gap-2" onClick={signOut}>
          <LogOut className="h-4 w-4" />
          {es.auth.logout}
        </Button>
      </div>
    </div>
  );
}
