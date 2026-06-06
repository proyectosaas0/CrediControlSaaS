"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { RouteCard } from "@/components/domain/route-card";
import { PaymentSheet } from "@/components/domain/payment-sheet";
import { AdminRutaView } from "@/components/domain/admin-ruta-view";
import { EmptyState } from "@/components/feedback/empty-state";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/providers/auth-provider";
import { useRutaHoy, type CuotaRuta } from "@/hooks/queries/use-ruta";
import { type MedioPago } from "@/lib/mock/ruta-types";
import type { RouteItem } from "@/lib/mock/ruta";
import { MapPin } from "lucide-react";
import { toast } from "sonner";

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
  const { data: rawItems = [], isLoading } = useRutaHoy();
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

  function handleCardClick(item: RouteItem) {
    if (item.estado === "pagado" || item.estado === "no_encontrado") return;
    setSelectedItem(item);
    setSheetOpen(true);
  }

  function handlePaymentSuccess(_id: string, _medioPago: MedioPago, _monto: number) {
    toast.success("Pago registrado");
    void queryClient.invalidateQueries({ queryKey: ["ruta"] });
    setSheetOpen(false);
  }

  function handleMarkNotFound(_itemId: string) {
    toast.info("Cliente marcado como no encontrado");
    setSheetOpen(false);
  }

  if (isLoading) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Cargando ruta...</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Ruta de hoy</h1>
          <p className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString("es-CO", {
              weekday: "short",
              day: "numeric",
              month: "long",
            })}
            {" "}&middot; {items.length} cobros
          </p>
        </div>
        <Badge variant="warning" className="text-xs">
          {pendientes.length} pendientes
        </Badge>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setFilter(opt.value)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors min-h-[32px] ${
              filter === opt.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {filteredItems.length === 0 ? (
        <EmptyState
          icon={<MapPin className="h-10 w-10" />}
          title="Sin cobros"
          description="No hay cobros con este filtro para hoy."
        />
      ) : (
        <div className="space-y-2">
          {filteredItems.map((item) => (
            <RouteCard
              key={item.id}
              {...item}
              onClick={() => handleCardClick(item)}
            />
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
