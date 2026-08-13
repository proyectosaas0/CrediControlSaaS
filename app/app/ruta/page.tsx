"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { RouteCard } from "@/components/domain/route-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/components/ui/cn";
import { PaymentSheet, type ReceiptRequest } from "@/components/domain/payment-sheet";
import { ReceiptDialog } from "@/components/domain/receipt-dialog";
import { AdminRutaView } from "@/components/domain/admin-ruta-view";
import { EmptyState } from "@/components/feedback/empty-state";
import { Badge } from "@/components/ui/badge";
import { PlatformStat } from "@/components/ui/platform-stat";
import { useAuth } from "@/providers/auth-provider";
import { useRutaHoy, type CuotaRuta } from "@/hooks/queries/use-ruta";
import { useAuthMe } from "@/hooks/queries/use-auth-me";
import { useWhatsApp } from "@/hooks/use-whatsapp";
import { buildPagoReceiptData } from "@/lib/domain/receipts";
import type { ReceiptData } from "@/lib/domain/receipt-canvas";
import { formatCop } from "@/lib/domain/money";
import { MEDIOS_PAGO, type MedioPago } from "@/lib/mock/ruta-types";
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
    cuotaTotal: cuota.prestamos.plazo_dias,
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
  const [sheetItems, setSheetItems] = useState<RouteItem[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [filter, setFilter] = useState<FilterType>("todos");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [receipt, setReceipt] = useState<{
    data: ReceiptData;
    whatsappLink: string;
    filename: string;
  } | null>(null);
  const { data: me } = useAuthMe();
  const { buildLink } = useWhatsApp();

  const items = rawItems.map(toRouteItem);
  const selectedItems = items.filter((i) => selectedIds.has(i.id));
  const selectedTotal = selectedItems.reduce((sum, i) => sum + Math.max(i.saldoPendiente, 0), 0);

  const filteredItems =
    filter === "todos" ? items : items.filter((i) => i.estado === filter);

  const pendientes = items.filter(
    (i) => i.estado === "pendiente" || i.estado === "mora" || i.estado === "parcial",
  );

  const totalEsperado = items.reduce((sum, item) => sum + item.montoEsperado, 0);
  const totalPagado = items.reduce((sum, item) => sum + (item.montoPagado ?? 0), 0);
  const totalPendiente = items.reduce((sum, item) => sum + Math.max(item.saldoPendiente, 0), 0);
  const avance = items.length > 0 ? Math.round(((items.length - pendientes.length) / items.length) * 100) : 0;
  const progresoMonetario = totalEsperado > 0 ? Math.round((totalPagado / totalEsperado) * 100) : 0;

  const filterOptions = FILTER_OPTIONS.map((option) => ({
    ...option,
    count:
      option.value === "todos"
        ? items.length
        : option.value === "no_encontrado"
          ? items.filter((item) => item.estado === "no_encontrado").length
          : items.filter((item) => item.estado === option.value).length,
  }));

  function openReceipt({ item, medioPago, monto, tipo, saldo }: ReceiptRequest) {
    const medioLabel = MEDIOS_PAGO.find((m) => m.value === medioPago)?.label ?? medioPago;
    const negocio = me?.organization?.nombre_negocio ?? "";
    const cobrador = me?.profile?.nombre_completo ?? "";
    const fecha = new Date().toLocaleString("es-CO");
    const cuotaLabel = item.cuotaTotal
      ? `${item.cuotaNumero}/${item.cuotaTotal}`
      : `${item.cuotaNumero}`;

    setSheetOpen(false);
    setReceipt({
      data: buildPagoReceiptData({
        negocio,
        cliente: item.clienteNombre,
        cobrador,
        monto,
        medioPago: medioLabel,
        tipo,
        cuota: item.cuotaNumero,
        saldo,
        fecha,
      }),
      whatsappLink: item.clienteTelefono
        ? buildLink({
            telefono: item.clienteTelefono,
            negocio,
            cliente: item.clienteNombre,
            monto,
            medioPago: medioLabel,
            cuota: cuotaLabel,
            saldo,
            cobrador,
            fecha,
          })
        : "",
      filename: `comprobante-${item.id.slice(-6)}.png`,
    });
  }

  function handleCardClick(item: RouteItem) {
    if (item.estado === "no_encontrado") return;

    // Una cuota ya pagada no se vuelve a cobrar: se reabre su comprobante.
    if (item.estado === "pagado") {
      const monto = item.montoPagado ?? item.montoEsperado;
      openReceipt({
        item,
        medioPago: item.medioPago ?? "efectivo",
        monto,
        tipo: monto < item.montoEsperado ? "parcial" : "cuota",
        saldo: Math.max(item.saldoPendiente, 0),
      });
      return;
    }

    setSheetItems([item]);
    setSheetOpen(true);
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleCobrarSelected() {
    if (selectedItems.length === 0) return;
    setSheetItems(selectedItems);
    setSheetOpen(true);
  }

  function handlePaymentSuccess(_ids: string[], _medioPago: MedioPago, _monto: number) {
    void _ids;
    void _medioPago;
    void _monto;
    toast.success("Pago registrado");
    void queryClient.invalidateQueries({ queryKey: ["ruta"] });
    void queryClient.invalidateQueries({ queryKey: ["pagos"] });
    setSelectedIds(new Set());
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

      <div
        className="dash-rise rounded-2xl border border-border bg-card p-4 backdrop-blur-sm"
        style={{ animationDelay: "20ms" }}
      >
        <div className="flex items-baseline justify-between gap-3 text-xs">
          <span className="text-muted-foreground">
            Recaudado{" "}
            <span className="font-semibold text-foreground tabular-nums">
              {formatCop(totalPagado)}
            </span>{" "}
            de {formatCop(totalEsperado)}
          </span>
          <span className="font-display text-sm font-bold text-primary tabular-nums">
            {progresoMonetario}%
          </span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="dash-fill h-full rounded-full bg-gradient-to-r from-primary to-violet-400"
            style={{ width: `${progresoMonetario}%` }}
          />
        </div>
      </div>

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
        <div className={cn("grid gap-3 md:grid-cols-2 xl:grid-cols-2", selectedIds.size > 0 && "pb-32 sm:pb-28")}>
          {filteredItems.map((item, i) => (
            <div key={item.id} className="dash-rise" style={staggerDelay(i)}>
              <RouteCard
                {...item}
                onClick={() => handleCardClick(item)}
                selectable={item.estado !== "pagado" && item.estado !== "no_encontrado"}
                selected={selectedIds.has(item.id)}
                onSelectChange={() => toggleSelect(item.id)}
              />
            </div>
          ))}
        </div>
      )}

      {selectedIds.size > 0 && (
        <div
          className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 p-2 shadow-[0_-4px_20px_rgba(0,0,0,0.12)] backdrop-blur-md sm:p-3"
          style={{ paddingBottom: "calc(0.5rem + env(safe-area-inset-bottom))", paddingTop: "calc(0.5rem + max(0.5rem, env(safe-area-inset-top)))" }}
        >
          <div className="mx-auto flex max-w-3xl flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-foreground sm:text-sm">
                {selectedIds.size} seleccionada{selectedIds.size !== 1 ? "s" : ""}
              </p>
              <p className="text-[11px] text-muted-foreground sm:text-xs">{formatCop(selectedTotal)}</p>
            </div>
            <Button
              size="lg"
              className="w-full font-bold h-14 sm:w-auto sm:h-12 sm:px-6 text-base sm:text-base"
              onClick={handleCobrarSelected}
            >
              Cobrar
            </Button>
          </div>
        </div>
      )}

      <PaymentSheet
        items={sheetItems}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onPaymentSuccess={handlePaymentSuccess}
        onMarkNotFound={handleMarkNotFound}
        onSendReceipt={openReceipt}
      />

      <ReceiptDialog
        open={receipt !== null}
        onClose={() => setReceipt(null)}
        data={receipt?.data ?? null}
        filename={receipt?.filename ?? "comprobante.png"}
        whatsappLink={receipt?.whatsappLink || null}
      />
    </div>
  );
}
