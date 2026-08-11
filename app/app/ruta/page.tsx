"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { RouteCard } from "@/components/domain/route-card";
import { Card } from "@/components/ui/card";
import { PaymentSheet } from "@/components/domain/payment-sheet";
import { AdminRutaView } from "@/components/domain/admin-ruta-view";
import { EmptyState } from "@/components/feedback/empty-state";
import { Badge } from "@/components/ui/badge";
import { PlatformStat } from "@/components/ui/platform-stat";
import { useAuth } from "@/providers/auth-provider";
import { useRutaHoy, type CuotaRuta } from "@/hooks/queries/use-ruta";
import { formatCop } from "@/lib/domain/money";
import { type MedioPago } from "@/lib/mock/ruta-types";
import type { RouteItem } from "@/lib/mock/ruta";
import { Clock3, CreditCard, MapPin, Wallet, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, FilterPills, staggerDelay } from "@/components/ui/page-header";

type FilterType = "todos" | CuotaRuta["estado"] | "no_encontrado";

const FILTER_OPTIONS: { value: FilterType; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "pendiente", label: "Pendientes" },
  { value: "pagado", label: "Pagados" },
  { value: "parcial", label: "Parciales" },
  { value: "mora", label: "En mora" },
];

function toRouteItem(cuota: CuotaRuta): RouteItem {
  return {
    id: cuota.id,
    clienteId: cuota.prestamos.cliente_id,
    clienteNombre: cuota.prestamos.clientes.nombre,
    clienteTelefono: cuota.prestamos.clientes.telefono ?? "",
    barrio: cuota.prestamos.clientes.barrio ?? "",
    direccion: cuota.prestamos.clientes.direccion ?? "",
    montoEsperado: cuota.monto_esperado,
    montoPagado: cuota.monto_pagado > 0 ? cuota.monto_pagado : null,
    medioPago: null,
    cuotaNumero: cuota.numero_cuota,
    cuotaTotal: 0,
    saldoPendiente: cuota.monto_esperado - cuota.monto_pagado,
    estado: cuota.estado as "pendiente" | "pagado" | "parcial" | "mora" | "no_encontrado",
  };
}

export default function RutaPage() {
  const { role } = useAuth();

  if (role === "admin" || role === "super_admin") {
    return <AdminRutaView />;
  }

  return <CobradorRutaView />;
}

function CobradorRutaView() {
  const { effectiveOrgId } = useAuth();
  const { data: rawItems = [], isLoading } = useRutaHoy(undefined, { enabled: !!effectiveOrgId });
  const queryClient = useQueryClient();
  const [selectedItem, setSelectedItem] = useState<RouteItem | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [filter, setFilter] = useState<FilterType>("todos");

  const items = rawItems.map(toRouteItem);

  const filteredItems =
    filter === "todos" ? items : items.filter((i) => i.estado === filter);

  const pendientes = items.filter(
    (i) => i.estado === "pendiente" || i.estado === "mora" || i.estado === "parcial",
  );

  const totalEsperado = items.reduce((sum, item) => sum + item.montoEsperado, 0);
  const totalPagado = items.reduce((sum, item) => sum + (item.montoPagado ?? 0), 0);
  const totalPendiente = items.reduce((sum, item) => sum + Math.max(item.saldoPendiente, 0), 0);
  const avance = items.length > 0 ? Math.round(((items.length - pendientes.length) / items.length) * 100) : 0;

  const filterOptions = FILTER_OPTIONS.map((option) => ({
    ...option,
    count:
      option.value === "todos"
        ? items.length
        : option.value === "no_encontrado"
          ? items.filter((item) => item.estado === "no_encontrado").length
          : items.filter((item) => item.estado === option.value).length,
  }));

  function handleCardClick(item: RouteItem) {
    if (item.estado === "pagado" || item.estado === "no_encontrado") return;
    setSelectedItem(item);
    setSheetOpen(true);
  }

  function handlePaymentSuccess(_id: string, _medioPago: MedioPago, _monto: number) {
    void _id;
    void _medioPago;
    void _monto;
    toast.success("Pago registrado");
    void queryClient.invalidateQueries({ queryKey: ["ruta"] });
    setSheetOpen(false);
  }

  function handleMarkNotFound(_itemId: string) {
    void _itemId;
    toast.info("Cliente marcado como no encontrado");
    setSheetOpen(false);
  }

  if (isLoading) {
    return (
      <Card padding="md" className="py-12 text-center">
        <p className="text-sm font-medium text-foreground">Cargando la ruta de hoy...</p>
        <p className="mt-1 text-xs text-muted-foreground">Preparando cobros, estados y filtros.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={new Date().toLocaleDateString("es-CO", {
          weekday: "long",
          day: "numeric",
          month: "long",
        })}
        title="Ruta de hoy"
        subtitle={`${items.length} cobro${items.length !== 1 ? "s" : ""} programados · ${avance}% ejecutado`}
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="warning" className="text-xs font-semibold">
              {pendientes.length} pendiente{pendientes.length !== 1 ? "s" : ""}
            </Badge>
            <Badge variant="primary" className="text-xs font-semibold">
              {avance}% avance
            </Badge>
          </div>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <PlatformStat
          icon={Wallet}
          label="Esperado"
          value={formatCop(totalEsperado)}
          chip="bg-primary/12 text-primary"
          delay={40}
        />
        <PlatformStat
          icon={CreditCard}
          label="Recaudado"
          value={formatCop(totalPagado)}
          chip="bg-success/12 text-success"
          delay={80}
        />
        <PlatformStat
          icon={Clock3}
          label="Pendiente"
          value={pendientes.length}
          chip="bg-warning/12 text-warning"
          delay={120}
        />
        <PlatformStat
          icon={TrendingUp}
          label="Saldo"
          value={formatCop(totalPendiente)}
          chip="bg-info/12 text-info"
          delay={160}
        />
      </div>

      <div className="dash-rise rounded-2xl border border-border bg-card/70 p-2 shadow-sm backdrop-blur-sm" style={{ animationDelay: "60ms" }}>
        <FilterPills options={filterOptions} value={filter} onChange={setFilter} className="px-1" />
      </div>

      {filteredItems.length === 0 ? (
        <EmptyState
          icon={<MapPin className="h-10 w-10" />}
          title="Sin cobros"
          description="No hay cobros con este filtro para hoy."
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-2">
          {filteredItems.map((item, i) => (
            <div key={item.id} className="dash-rise" style={staggerDelay(i)}>
              <RouteCard {...item} onClick={() => handleCardClick(item)} />
            </div>
          ))}
        </div>
      )}

      <PaymentSheet
        item={selectedItem}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onPaymentSuccess={handlePaymentSuccess}
        onMarkNotFound={handleMarkNotFound}
      />
    </div>
  );
}
