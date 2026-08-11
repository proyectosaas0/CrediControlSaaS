"use client";

import { useState } from "react";
import Link from "next/link";
import { Banknote, Plus, Calendar, CreditCard } from "lucide-react";
import { usePagos, useCronogramaPrestamo, type Pago } from "@/hooks/queries/use-pagos";
import { useClientes } from "@/hooks/queries/use-clientes";
import { usePrestamos } from "@/hooks/queries/use-prestamos";
import { useAuth } from "@/providers/auth-provider";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  PageHeader,
  SearchInput,
  FilterPills,
  staggerDelay,
} from "@/components/ui/page-header";
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

type PagoGroup = { key: string; label: string; pagos: Pago[]; total: number };

function dateKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function formatGroupLabel(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (dateKey(date) === dateKey(today)) return "Hoy";
  if (dateKey(date) === dateKey(yesterday)) return "Ayer";

  const label = date.toLocaleDateString("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: date.getFullYear() === today.getFullYear() ? undefined : "numeric",
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function groupPagosByDate(pagos: Pago[]): PagoGroup[] {
  const groups: PagoGroup[] = [];
  const byKey = new Map<string, PagoGroup>();

  for (const pago of pagos) {
    const key = dateKey(new Date(pago.created_at));
    let group = byKey.get(key);
    if (!group) {
      group = { key, label: formatGroupLabel(pago.created_at), pagos: [], total: 0 };
      byKey.set(key, group);
      groups.push(group);
    }
    group.pagos.push(pago);
    group.total += pago.monto;
  }

  return groups;
}

export default function PagosPage() {
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const { role } = useAuth();
  const queryClient = useQueryClient();
  const { data: pagos = [], isPending, error, refetch } = usePagos();

  const canRegistrarPago = role === "admin" || role === "super_admin" || role === "cobrador";

  const filtered = pagos.filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (p.clientes?.nombre ?? "").toLowerCase().includes(q) ||
      p.id.toLowerCase().includes(q)
    );
  });

  const totalMonto = filtered.reduce((sum, p) => sum + p.monto, 0);
  const groups = groupPagosByDate(filtered);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Finanzas"
        title="Pagos"
        subtitle={
          isPending ? (
            "Cargando pagos…"
          ) : (
            <>
              {filtered.length} pago{filtered.length !== 1 ? "s" : ""} · total{" "}
              <span className="font-semibold text-foreground tabular-nums">
                {formatCop(totalMonto)}
              </span>
            </>
          )
        }
        actions={
          canRegistrarPago && (
            <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-1.5">
              <Plus className="h-4 w-4" strokeWidth={2.5} />
              <span className="hidden sm:inline">Registrar pago</span>
              <span className="sm:hidden">Registrar</span>
            </Button>
          )
        }
      />

      <div className="dash-rise" style={{ animationDelay: "60ms" }}>
        <SearchInput
          placeholder="Buscar por cliente o ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

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
            canRegistrarPago && !search ? (
              <Button size="sm" onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4" />
                Registrar pago
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <div key={group.key} className="space-y-2.5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 flex-1 items-center gap-2.5">
                  <h2 className="shrink-0 text-sm font-bold text-foreground">
                    {group.label}
                  </h2>
                  <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 px-1.5 text-[11px] font-bold tabular-nums text-primary">
                    {group.pagos.length}
                  </span>
                  <span className="hidden h-px flex-1 bg-gradient-to-r from-border to-transparent sm:block" />
                </div>
                <p className="shrink-0 text-sm font-semibold tabular-nums text-muted-foreground">
                  {formatCop(group.total)}
                </p>
              </div>

              <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {group.pagos.map((pago, i) => (
                  <Link key={pago.id} href={`/app/pagos/${pago.id}`} className="block h-full">
                    <div
                      className="dash-rise group flex h-full items-center gap-3.5 rounded-xl border border-border bg-card px-4 py-3.5 backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-lg hover:shadow-primary/5"
                      style={staggerDelay(i)}
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-success/15 text-success">
                        <Banknote className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
                            {pago.clientes?.nombre ?? "—"}
                          </p>
                          <p className="shrink-0 font-display text-sm font-bold tabular-nums text-success">
                            +{formatCop(pago.monto)}
                          </p>
                        </div>
                        <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(pago.created_at).toLocaleDateString("es-CO")}
                          </span>
                          <span className="flex items-center gap-1 capitalize">
                            <CreditCard className="h-3 w-3" />
                            {pago.medio_pago}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {canRegistrarPago && (
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

const MODOS_PAGO = [
  { value: "cuota", label: "Por cuota" },
  { value: "abono", label: "Abono al préstamo" },
];

function RegisterPaymentForm({ onSuccess, onCancel }: RegisterPaymentFormProps) {
  const queryClient = useQueryClient();
  const [clienteId, setClienteId] = useState("");
  const [prestamoId, setPrestamoId] = useState("");
  const [modo, setModo] = useState<"cuota" | "abono">("cuota");
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
  const selectedPrestamo = prestamos.find((p) => p.id === prestamoId);
  const saldoPendiente = selectedPrestamo?.prestamo_saldos?.[0]?.saldo_pendiente;

  function handleClienteChange(id: string) {
    setClienteId(id);
    setPrestamoId("");
    setCuotaId("");
    setMonto("");
  }

  function handlePrestamoChange(id: string) {
    setPrestamoId(id);
    setModo("cuota");
    setCuotaId("");
    setMonto("");
  }

  function handleModoChange(value: string) {
    setModo(value as "cuota" | "abono");
    setCuotaId("");
    setMonto("");
    setTipo(value === "abono" ? "abono" : "cuota");
  }

  function handleCuotaChange(id: string) {
    setCuotaId(id);
    const cuota = cuotas.find((c) => c.id === id);
    if (cuota) setMonto(String(Math.round(cuota.monto_esperado)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (modo === "abono") {
      if (!prestamoId || !medioPago || !monto) {
        toast.error("Completa todos los campos obligatorios");
        return;
      }
    } else if (!cuotaId || !medioPago || !monto) {
      toast.error("Completa todos los campos obligatorios");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/pagos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...(modo === "abono" ? { prestamoId } : { cronogramaPagoId: cuotaId }),
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

  const canSubmit = modo === "abono" ? !!prestamoId : !!cuotaId;

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
        <FilterPills options={MODOS_PAGO} value={modo} onChange={handleModoChange} />
      )}

      {prestamoId && modo === "cuota" && (
        <Select
          label="Cuota *"
          options={cuotaOptions}
          placeholder={pendingCuotas.length === 0 ? "Sin cuotas pendientes" : "Seleccionar cuota"}
          value={cuotaId}
          onChange={(e) => handleCuotaChange(e.target.value)}
          disabled={pendingCuotas.length === 0}
        />
      )}

      {prestamoId && modo === "abono" && saldoPendiente !== undefined && (
        <p className="text-xs text-muted-foreground">
          Saldo pendiente del préstamo:{" "}
          <span className="font-semibold text-foreground">{formatCop(saldoPendiente)}</span>.
          El abono se aplica automáticamente a las cuotas pendientes más próximas.
        </p>
      )}

      {((modo === "cuota" && cuotaId) || (modo === "abono" && prestamoId)) && (
        <>
          {modo === "cuota" && (
            <Select
              label="Tipo de pago *"
              options={TIPOS_PAGO}
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
            />
          )}
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
          disabled={!canSubmit || !medioPago || !monto}
          className="flex-1"
        >
          Registrar pago
        </Button>
      </div>
    </form>
  );
}
