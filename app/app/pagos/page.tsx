"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Banknote, Plus, Calendar, CreditCard } from "lucide-react";
import { usePagos, useCronogramaPrestamo } from "@/hooks/queries/use-pagos";
import { useClientes } from "@/hooks/queries/use-clientes";
import { usePrestamos } from "@/hooks/queries/use-prestamos";
import { useAuth } from "@/providers/auth-provider";
import { useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { SkeletonList } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { formatCop } from "@/lib/domain/money";
import { toast } from "sonner";

const MEDIOS_PAGO = [
  { value: "efectivo", label: "Efectivo" },
  { value: "nequi", label: "Nequi" },
  { value: "transferencia", label: "Transferencia" },
];

const TIPOS_PAGO = [
  { value: "cuota", label: "Cuota regular" },
  { value: "parcial", label: "Pago parcial" },
  { value: "vencida", label: "Cuota vencida" },
  { value: "mora", label: "Pago de mora" },
  { value: "liquidacion", label: "Liquidación" },
];

export default function PagosPage() {
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const { role } = useAuth();
  const queryClient = useQueryClient();
  const { data: pagos = [], isPending, error, refetch } = usePagos();

  const isAdmin = role === "admin" || role === "super_admin";

  const filtered = pagos.filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (p.clientes?.nombre ?? "").toLowerCase().includes(q) ||
      p.id.toLowerCase().includes(q)
    );
  });

  const totalMonto = filtered.reduce((sum, p) => sum + p.monto, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Pagos</h1>
        {isAdmin && (
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline ml-1">Registrar</span>
          </Button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar por cliente o ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex h-11 w-full rounded-lg border border-border bg-background pl-10 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
        />
      </div>

      <p className="text-xs text-muted-foreground">
        {filtered.length} pago{filtered.length !== 1 ? "s" : ""} · Total:{" "}
        {formatCop(totalMonto)}
      </p>

      {isPending ? (
        <SkeletonList count={4} />
      ) : error ? (
        <ErrorState message={error.message} onRetry={() => refetch()} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Banknote}
          title={search ? "Sin resultados" : "Sin pagos registrados"}
          description={
            search
              ? "Intenta con otro término de búsqueda."
              : "Los pagos aparecerán aquí cuando se registren cuotas."
          }
          action={
            isAdmin && !search ? (
              <Button size="sm" onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4" />
                Registrar pago
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((pago) => (
            <Link key={pago.id} href={`/app/pagos/${pago.id}`}>
              <Card
                padding="md"
                className="transition-colors hover:border-primary/30 cursor-pointer h-full"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground">
                    {pago.clientes?.nombre ?? "—"}
                  </p>
                  <p className="text-sm font-semibold text-foreground">
                    {formatCop(pago.monto)}
                  </p>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(pago.created_at).toLocaleDateString("es-CO")}
                  </span>
                  <span className="flex items-center gap-1">
                    <CreditCard className="h-3 w-3" />
                    {pago.medio_pago}
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {isAdmin && (
        <Dialog
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          title="Registrar pago"
        >
          <RegisterPaymentForm
            onSuccess={() => {
              setCreateOpen(false);
              void queryClient.invalidateQueries({ queryKey: ["pagos"] });
            }}
            onCancel={() => setCreateOpen(false)}
          />
        </Dialog>
      )}
    </div>
  );
}

type RegisterPaymentFormProps = {
  onSuccess: () => void;
  onCancel: () => void;
};

function RegisterPaymentForm({ onSuccess, onCancel }: RegisterPaymentFormProps) {
  const queryClient = useQueryClient();
  const [clienteId, setClienteId] = useState("");
  const [prestamoId, setPrestamoId] = useState("");
  const [cuotaId, setCuotaId] = useState("");
  const [medioPago, setMedioPago] = useState("");
  const [tipo, setTipo] = useState("cuota");
  const [monto, setMonto] = useState("");
  const [nota, setNota] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: clientes = [], isPending: loadingClientes } = useClientes();
  const { data: prestamos = [] } = usePrestamos(
    clienteId ? { clienteId, estado: "activo" } : undefined,
  );
  const { data: cuotas = [] } = useCronogramaPrestamo(prestamoId || null);

  const pendingCuotas = cuotas.filter(
    (c) => c.estado === "pendiente" || c.estado === "vencido" || c.estado === "parcial",
  );

  const selectedCuota = cuotas.find((c) => c.id === cuotaId);

  function handleClienteChange(id: string) {
    setClienteId(id);
    setPrestamoId("");
    setCuotaId("");
    setMonto("");
  }

  function handlePrestamoChange(id: string) {
    setPrestamoId(id);
    setCuotaId("");
    setMonto("");
  }

  function handleCuotaChange(id: string) {
    setCuotaId(id);
    const cuota = cuotas.find((c) => c.id === id);
    if (cuota) setMonto(String(Math.round(cuota.monto_esperado)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!cuotaId || !medioPago || !monto) {
      toast.error("Completa todos los campos obligatorios");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/pagos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cronogramaPagoId: cuotaId,
        medioPago,
        monto: Number(monto),
        tipo,
        nota: nota || undefined,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      toast.error(json.error?.message ?? "Error al registrar pago");
      return;
    }
    toast.success("Pago registrado correctamente");
    void queryClient.invalidateQueries({ queryKey: ["pagos"] });
    onSuccess();
  }

  const clienteOptions = clientes.map((c) => ({
    value: c.id,
    label: c.cedula ? `${c.nombre} · ${c.cedula}` : c.nombre,
  }));

  const prestamoOptions = prestamos.map((p) => ({
    value: p.id,
    label: `${formatCop(p.capital)} · ${p.modelo_interes.replace("_", " ")}`,
  }));

  const cuotaOptions = pendingCuotas.map((c) => ({
    value: c.id,
    label: `Cuota ${c.numero_cuota} · ${formatCop(c.monto_esperado)} · ${c.estado}`,
  }));

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Select
        label="Cliente *"
        options={clienteOptions}
        placeholder={loadingClientes ? "Cargando..." : "Buscar cliente..."}
        value={clienteId}
        onChange={(e) => handleClienteChange(e.target.value)}
        disabled={loadingClientes}
        searchable
      />

      {clienteId && (
        <Select
          label="Préstamo *"
          options={prestamoOptions}
          placeholder={prestamos.length === 0 ? "Sin préstamos activos" : "Seleccionar préstamo"}
          value={prestamoId}
          onChange={(e) => handlePrestamoChange(e.target.value)}
          disabled={prestamos.length === 0}
        />
      )}

      {prestamoId && (
        <Select
          label="Cuota *"
          options={cuotaOptions}
          placeholder={pendingCuotas.length === 0 ? "Sin cuotas pendientes" : "Seleccionar cuota"}
          value={cuotaId}
          onChange={(e) => handleCuotaChange(e.target.value)}
          disabled={pendingCuotas.length === 0}
        />
      )}

      {cuotaId && (
        <>
          <Select
            label="Tipo de pago *"
            options={TIPOS_PAGO}
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
          />
          <Select
            label="Método de pago *"
            options={MEDIOS_PAGO}
            placeholder="Seleccionar método"
            value={medioPago}
            onChange={(e) => setMedioPago(e.target.value)}
          />
          <Input
            label="Monto *"
            type="number"
            min="1"
            step="1"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            placeholder={selectedCuota ? String(Math.round(selectedCuota.monto_esperado)) : "0"}
          />
          <Input
            label="Nota"
            placeholder="Observaciones opcionales..."
            value={nota}
            onChange={(e) => setNota(e.target.value)}
          />
        </>
      )}

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancelar
        </Button>
        <Button
          type="submit"
          loading={saving}
          disabled={!cuotaId || !medioPago || !monto}
          className="flex-1"
        >
          Registrar pago
        </Button>
      </div>
    </form>
  );
}
