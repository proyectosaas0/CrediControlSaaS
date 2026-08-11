"use client";

import { useState, useMemo } from "react";
import {
  Phone,
  MapPin,
  Calendar,
  Clock,
  PlayCircle,
  PauseCircle,
  CalendarPlus,
  ArrowUpRight,
  ArrowLeft,
  ShieldCheck,
  Building2,
} from "lucide-react";
import {
  useTenants,
  useActivarTenant,
  useSuspenderTenant,
  useExtenderTrialTenant,
  type Tenant,
} from "@/hooks/queries/use-super-admin";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  PageHeader,
  FilterPills,
  SearchInput,
  SectionHead,
  staggerDelay,
} from "@/components/ui/page-header";
import { SkeletonList } from "@/components/ui/skeleton";
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

  const { data: tenants = [], isLoading } = useTenants();

  const filtered = useMemo(() => {
    let list = tenants;
    if (filtroEstado !== "todos") {
      list = list.filter((t) => t.estado_suscripcion === filtroEstado);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) =>
          t.nombre_negocio.toLowerCase().includes(q) ||
          (t.ciudad && t.ciudad.toLowerCase().includes(q)),
      );
    }
    return list;
  }, [search, filtroEstado, tenants]);

  const tenant = selectedTenant
    ? tenants.find((t) => t.id === selectedTenant)
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
    <div className="space-y-5">
      <PageHeader
        eyebrow="Plataforma"
        title="Tenants"
        subtitle={
          isLoading
            ? "Cargando tenants…"
            : `${filtered.length} negocio${filtered.length !== 1 ? "s" : ""} registrados`
        }
      />

      <div
        className="dash-rise flex flex-col gap-3 sm:flex-row sm:items-center"
        style={{ animationDelay: "60ms" }}
      >
        <SearchInput
          placeholder="Buscar por nombre o ciudad…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          containerClassName="flex-1"
        />
        <FilterPills options={ESTADOS} value={filtroEstado} onChange={setFiltroEstado} />
      </div>

      {isLoading ? (
        <SkeletonList count={4} />
      ) : filtered.length === 0 ? (
        <div className="dash-rise rounded-2xl border border-dashed border-border py-12 text-center">
          <p className="font-display text-base font-bold text-foreground">
            No se encontraron tenants
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            No hay tenants con el filtro seleccionado.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((t, i) => {
            const badge = estadoBadge[t.estado_suscripcion] ?? { className: "bg-muted text-muted-foreground", label: t.estado_suscripcion };
            return (
              <Card
                key={t.id}
                padding="md"
                className="dash-rise group cursor-pointer transition-all hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-lg hover:shadow-primary/5"
                style={staggerDelay(i)}
                onClick={() => setSelectedTenant(t.id)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Building2 className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
                          {t.nombre_negocio}
                        </p>
                        <span
                          className={cn(
                            "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
                            badge.className,
                          )}
                        >
                          {badge.label}
                        </span>
                        <span
                          className={cn(
                            "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                            t.plan === "trial"
                              ? "bg-warning/15 text-warning"
                              : "bg-primary/15 text-primary",
                          )}
                        >
                          {planLabel[t.plan] ?? t.plan}
                        </span>
                      </div>

                      <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
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
                          {t.created_at}
                        </span>
                      </div>
                    </div>
                  </div>

                  <ArrowUpRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/40 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TenantDetail({
  tenant,
  onBack,
}: {
  tenant: Tenant;
  onBack: () => void;
}) {
  const badge = estadoBadge[tenant.estado_suscripcion] ?? { className: "bg-muted text-muted-foreground", label: tenant.estado_suscripcion };

  const activar = useActivarTenant();
  const suspender = useSuspenderTenant();
  const extenderTrial = useExtenderTrialTenant();

  const handleActivar = () => {
    activar.mutate(tenant.id, {
      onSuccess: () => toast.success("Tenant activado correctamente"),
      onError: (err) => toast.error(err instanceof Error ? err.message : "No se pudo activar el tenant"),
    });
  };

  const handleSuspender = () => {
    suspender.mutate(tenant.id, {
      onSuccess: () => toast.success("Tenant suspendido"),
      onError: (err) => toast.error(err instanceof Error ? err.message : "No se pudo suspender el tenant"),
    });
  };

  const handleExtenderTrial = () => {
    const base = tenant.trial_hasta ? new Date(`${tenant.trial_hasta}T00:00:00Z`) : new Date();
    const start = base.getTime() > Date.now() ? base : new Date();
    const nuevaFecha = new Date(start.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    extenderTrial.mutate(
      { tenantId: tenant.id, trialHasta: nuevaFecha },
      {
        onSuccess: () => toast.success("Periodo de trial extendido 15 dias"),
        onError: (err) => toast.error(err instanceof Error ? err.message : "No se pudo extender el trial"),
      },
    );
  };

  const trialDaysLeft = (() => {
    if (tenant.estado_suscripcion !== "trial") return 0;
    if (!tenant.trial_hasta) return 0;
    const now = new Date();
    const end = new Date(tenant.trial_hasta);
    return Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  })();

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="dash-rise group flex items-center gap-1.5 rounded-md text-sm font-medium text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
        Volver
      </button>

      <div
        className="dash-rise flex flex-wrap items-end justify-between gap-3"
        style={{ animationDelay: "40ms" }}
      >
        <div>
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
            Tenant
          </p>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {tenant.nombre_negocio}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {tenant.ciudad ?? "Sin ciudad"} · Creado {tenant.created_at}
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
      <Card padding="md" className="dash-rise p-5" style={{ animationDelay: "80ms" }}>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-xs text-muted-foreground">Plan</dt>
            <dd className="mt-0.5 font-medium text-foreground">
              {planLabel[tenant.plan] ?? tenant.plan}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Trial hasta</dt>
            <dd className="mt-0.5 font-medium tabular-nums text-foreground">
              {tenant.trial_hasta ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Teléfono</dt>
            <dd className="mt-0.5 font-medium text-foreground">
              {tenant.telefono ?? "—"}
            </dd>
          </div>
        </dl>

        {trialDaysLeft > 0 && (
          <div className="mt-4 border-t border-dashed border-border pt-3.5">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-warning" />
              <span className="text-sm font-medium text-warning">
                {trialDaysLeft} día{trialDaysLeft !== 1 ? "s" : ""} restantes de trial
              </span>
            </div>
          </div>
        )}
      </Card>

      {/* Actions */}
      <div className="dash-rise" style={{ animationDelay: "140ms" }}>
        <SectionHead title="Acciones" />
        <div className="grid grid-cols-2 gap-2">
          {tenant.estado_suscripcion === "suspendido" && (
            <Button
              size="sm"
              variant="success"
              onClick={handleActivar}
              disabled={activar.isPending}
              className="w-full"
            >
              <PlayCircle className="h-4 w-4" />
              Activar
            </Button>
          )}
          {tenant.estado_suscripcion === "activo" && (
            <Button
              size="sm"
              variant="danger"
              onClick={handleSuspender}
              disabled={suspender.isPending}
              className="w-full"
            >
              <PauseCircle className="h-4 w-4" />
              Suspender
            </Button>
          )}
          {tenant.estado_suscripcion === "trial" && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleExtenderTrial}
              disabled={extenderTrial.isPending}
              className="w-full"
            >
              <CalendarPlus className="h-4 w-4" />
              Extender trial
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => toast.info(`Vista de admin: ${tenant.nombre_negocio}`)}
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
