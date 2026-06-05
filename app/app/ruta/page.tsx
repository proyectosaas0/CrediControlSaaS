"use client";

import { useState } from "react";
import { RouteCard } from "@/components/domain/route-card";
import { PaymentSheet } from "@/components/domain/payment-sheet";
import { AdminRutaView } from "@/components/domain/admin-ruta-view";
import { EmptyState } from "@/components/feedback/empty-state";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/providers/auth-provider";
import { MOCK_ROUTE_ITEMS, type RouteItem, type RouteItemStatus } from "@/lib/mock/ruta";
import { type MedioPago } from "@/lib/mock/ruta-types";
import { MapPin } from "lucide-react";
import { toast } from "sonner";
import { formatCop } from "@/lib/domain/money";

type FilterType = "todos" | RouteItemStatus;

const FILTER_OPTIONS: { value: FilterType; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "pendiente", label: "Pendientes" },
  { value: "pagado", label: "Pagados" },
  { value: "parcial", label: "Parciales" },
  { value: "mora", label: "En mora" },
];

export default function RutaPage() {
  const { role } = useAuth();

  if (role === "admin" || role === "super_admin") {
    return <AdminRutaView />;
  }

  return <CobradorRutaView />;
}

function CobradorRutaView() {
  const [items, setItems] = useState<RouteItem[]>(MOCK_ROUTE_ITEMS);
  const [selectedItem, setSelectedItem] = useState<RouteItem | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [filter, setFilter] = useState<FilterType>("todos");

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

  function handlePaymentSuccess(itemId: string, medioPago: MedioPago, monto: number) {
    setItems((prev) =>
      prev.map((i) => {
        if (i.id !== itemId) return i;
        const isFull = monto >= i.montoEsperado;
        return {
          ...i,
          montoPagado: monto,
          medioPago,
          estado: (isFull ? "pagado" : "parcial") as RouteItemStatus,
        };
      }),
    );
    toast.success(`Pago de ${formatCop(monto)} registrado`);
  }

  function handleMarkNotFound(itemId: string) {
    setItems((prev) =>
      prev.map((i) =>
        i.id === itemId
          ? { ...i, estado: "no_encontrado" as RouteItemStatus }
          : i,
      ),
    );
    toast.info("Cliente marcado como no encontrado");
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
