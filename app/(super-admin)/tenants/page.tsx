"use client";

import { useState, useMemo } from "react";
import {
  Search,
  Phone,
  MapPin,
  Calendar,
  Clock,
  Users,
  Activity,
  UserCheck,
  PlayCircle,
  PauseCircle,
  CalendarPlus,
  Eye,
  ArrowLeft,
  ShieldCheck,
} from "lucide-react";
import { MOCK_TENANTS, type MockTenant } from "@/lib/mock/super-admin";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/components/ui/cn";
import { toast } from "sonner";

type FiltroEstado = "todos" | "activo" | "trial" | "suspendido" | "expirado";

const ESTADOS: { value: FiltroEstado; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "activo", label: "Activo" },
  { value: "trial", label: "Trial" },
  { value: "suspendido", label: "Suspendido" },
  { value: "expirado", label: "Expirado" },
];

const estadoBadge: Record<string, { className: string; label: string }> = {
  activo: { className: "bg-success/15 text-success", label: "Activo" },
  trial: { className: "bg-info/15 text-info", label: "Trial" },
  suspendido: { className: "bg-danger/15 text-danger", label: "Suspendido" },
  expirado: { className: "bg-muted text-muted-foreground", label: "Expirado" },
  cancelado: { className: "bg-muted text-muted-foreground", label: "Cancelado" },
};

const planLabel: Record<string, string> = {
  trial: "Gratuito",
  basico: "Basico",
  pro: "Pro",
  enterprise: "Empresarial",
};

export default function TenantsPage() {
  const [search, setSearch] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>("todos");
  const [selectedTenant, setSelectedTenant] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = MOCK_TENANTS;
    if (filtroEstado !== "todos") {
      list = list.filter((t) => t.estadoSuscripcion === filtroEstado);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) =>
          t.nombreNegocio.toLowerCase().includes(q) ||
          (t.ciudad && t.ciudad.toLowerCase().includes(q)),
      );
    }
    return list;
  }, [search, filtroEstado]);

  const tenant = selectedTenant
    ? MOCK_TENANTS.find((t) => t.id === selectedTenant)
    : null;

  if (tenant) {
    return (
      <TenantDetail
        tenant={tenant}
        onBack={() => setSelectedTenant(null)}
      />
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-foreground">Tenants</h1>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar por nombre o ciudad..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex h-11 w-full rounded-lg border border-border bg-background pl-10 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {ESTADOS.map((e) => (
          <button
            key={e.value}
            onClick={() => setFiltroEstado(e.value)}
            className={cn(
              "whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              filtroEstado === e.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80",
            )}
          >
            {e.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-muted-foreground">No se encontraron tenants</p>
          <p className="text-xs text-muted-foreground mt-1">
            No hay tenants con el filtro seleccionado.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((t) => {
            const badge = estadoBadge[t.estadoSuscripcion];
            return (
              <Card
                key={t.id}
                padding="md"
                className="cursor-pointer hover:border-primary/30 transition-colors"
                onClick={() => setSelectedTenant(t.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {t.nombreNegocio}
                      </p>
                      <span
                        className={cn(
                          "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
                          badge.className,
                        )}
                      >
                        {badge.label}
                      </span>
                    </div>

                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                      {t.ciudad && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {t.ciudad}
                        </span>
                      )}
                      {t.telefono && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {t.telefono}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {t.createdAt}
                      </span>
                    </div>

                    <div className="mt-2 flex items-center gap-3 text-xs">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Users className="h-3 w-3" />
                        {t.clientes}
                      </span>
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Activity className="h-3 w-3" />
                        {t.prestamos}
                      </span>
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <UserCheck className="h-3 w-3" />
                        {t.cobradores}
                      </span>
                      <span
                        className={cn(
                          "rounded px-1.5 py-0.5 text-xs font-medium",
                          t.plan === "trial"
                            ? "bg-warning/15 text-warning"
                            : "bg-primary/15 text-primary",
                        )}
                      >
                        {planLabel[t.plan] ?? t.plan}
                      </span>
                    </div>
                  </div>

                  <Eye className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <p className="text-center text-xs text-muted-foreground">
        {filtered.length} tenant{filtered.length !== 1 ? "s" : ""}
      </p>
    </div>
  );
}

function TenantDetail({
  tenant,
  onBack,
}: {
  tenant: MockTenant;
  onBack: () => void;
}) {
  const badge = estadoBadge[tenant.estadoSuscripcion];

  const trialDaysLeft = (() => {
    if (tenant.estadoSuscripcion !== "trial") return 0;
    const now = new Date();
    const end = new Date(tenant.trialHasta);
    return Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  })();

  return (
    <div className="space-y-5">
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver
      </button>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">{tenant.nombreNegocio}</h1>
          <p className="text-sm text-muted-foreground">
            {tenant.ciudad ?? "Sin ciudad"} · Creado {tenant.createdAt}
          </p>
        </div>
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-xs font-medium",
            badge.className,
          )}
        >
          {badge.label}
        </span>
      </div>

      {/* Info */}
      <Card padding="md">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-muted-foreground">Plan</p>
            <p className="font-medium text-foreground">
              {planLabel[tenant.plan] ?? tenant.plan}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Trial hasta</p>
            <p className="font-medium text-foreground">{tenant.trialHasta}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Telefono</p>
            <p className="font-medium text-foreground">
              {tenant.telefono ?? "—"}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Ultimo acceso</p>
            <p className="font-medium text-foreground text-xs">
              {tenant.ultimoAcceso
                ? new Date(tenant.ultimoAcceso).toLocaleString("es-CO")
                : "—"}
            </p>
          </div>
        </div>

        {trialDaysLeft > 0 && (
          <div className="mt-3 pt-3 border-t border-border">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-warning" />
              <span className="text-sm text-warning font-medium">
                {trialDaysLeft} dias restantes de trial
              </span>
            </div>
          </div>
        )}
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card padding="md">
          <p className="text-xs text-muted-foreground">Clientes</p>
          <p className="text-lg font-bold text-foreground">{tenant.clientes}</p>
        </Card>
        <Card padding="md">
          <p className="text-xs text-muted-foreground">Prestamos</p>
          <p className="text-lg font-bold text-foreground">{tenant.prestamos}</p>
        </Card>
        <Card padding="md">
          <p className="text-xs text-muted-foreground">Cobradores</p>
          <p className="text-lg font-bold text-foreground">{tenant.cobradores}</p>
        </Card>
      </div>

      {/* Actions */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground">Acciones</h2>
        <div className="grid grid-cols-2 gap-2">
          {tenant.estadoSuscripcion === "suspendido" && (
            <Button
              size="sm"
              variant="success"
              onClick={() => toast.success("Tenant activado correctamente")}
              className="w-full"
            >
              <PlayCircle className="h-4 w-4" />
              Activar
            </Button>
          )}
          {tenant.estadoSuscripcion === "activo" && (
            <Button
              size="sm"
              variant="danger"
              onClick={() => toast.success("Tenant suspendido")}
              className="w-full"
            >
              <PauseCircle className="h-4 w-4" />
              Suspender
            </Button>
          )}
          {tenant.estadoSuscripcion === "trial" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => toast.success("Periodo de trial extendido 15 dias")}
              className="w-full"
            >
              <CalendarPlus className="h-4 w-4" />
              Extender trial
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => toast.info(`Vista de admin: ${tenant.nombreNegocio}`)}
            className="w-full"
          >
            <ShieldCheck className="h-4 w-4" />
            Ver como admin
          </Button>
        </div>
      </div>
    </div>
  );
}
