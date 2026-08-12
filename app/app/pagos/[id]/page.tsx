"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Banknote,
  Calendar,
  MapPin,
  MessageSquare,
  Pencil,
  Trash2,
  User,
  CreditCard,
  FileText,
  AlertCircle,
} from "lucide-react";
import { usePago } from "@/hooks/queries/use-pagos";
import { useAuth } from "@/providers/auth-provider";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { cn } from "@/components/ui/cn";
import { formatCop } from "@/lib/domain/money";
import { toast } from "sonner";

const MEDIOS_PAGO = [
  { value: "efectivo", label: "Efectivo" },
  { value: "nequi", label: "Nequi" },
  { value: "transferencia", label: "Transferencia" },
];

const TIPO_LABELS: Record<string, string> = {
  cuota: "Cuota regular",
  parcial: "Pago parcial",
  vencida: "Cuota vencida",
  mora: "Pago de mora",
  liquidacion: "Liquidación",
};

export default function PagoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { role, user } = useAuth();
  const queryClient = useQueryClient();

  const { data: pago, isLoading, error } = usePago(id);

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isAdmin = role === "admin" || role === "super_admin";

  async function handleDelete() {
    setDeleting(true);
    const res = await fetch(`/api/pagos/${id}`, { method: "DELETE" });
    setDeleting(false);
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      toast.error(json.error?.message ?? "Error al anular el pago");
      return;
    }
    toast.success("Pago anulado correctamente");
    void queryClient.invalidateQueries({ queryKey: ["pagos"] });
    router.push("/app/pagos");
  }

  const isAnulado = !!pago?.anulado_at;
  const canAnular = !isAnulado && (isAdmin || (role === "cobrador" && pago?.registrado_por === user?.id));

  if (isLoading) {
    return (
      <div className="py-16 text-center text-muted-foreground">Cargando...</div>
    );
  }

  if (error || !pago) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground">Pago no encontrado</p>
        <button
          onClick={() => router.back()}
          className="mt-4 text-sm text-primary underline"
        >
          Volver
        </button>
      </div>
    );
  }

  const fecha = new Date(pago.created_at).toLocaleString("es-CO", {
    dateStyle: "long",
    timeStyle: "short",
  });

  return (
    <div className="space-y-5">
      <button
        onClick={() => router.back()}
        className="dash-rise group flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
        Volver a pagos
      </button>

      {/* Header card */}
      <Card
        padding="md"
        className="dash-rise relative overflow-hidden p-5"
        style={{ animationDelay: "60ms" }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 70% at 10% 0%, color-mix(in srgb, var(--success) 8%, transparent), transparent 60%)",
          }}
        />
        <div className="relative flex items-start justify-between gap-3">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-semibold text-success">
                {TIPO_LABELS[pago.tipo] ?? pago.tipo}
              </span>
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium capitalize text-muted-foreground">
                {pago.medio_pago}
              </span>
              {isAnulado && (
                <span className="rounded-full bg-danger/15 px-2.5 py-0.5 text-xs font-semibold text-danger">
                  Anulado
                </span>
              )}
            </div>
            <p
              className={cn(
                "font-display text-3xl font-bold tracking-tight tabular-nums sm:text-4xl",
                isAnulado ? "text-muted-foreground line-through" : "text-foreground",
              )}
            >
              {formatCop(pago.monto)}
            </p>
            <p className="mt-1.5 text-sm text-muted-foreground">{fecha}</p>
          </div>

          {(isAdmin || canAnular) && (
            <div className="flex shrink-0 items-center gap-2">
              {isAdmin && !isAnulado && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditOpen(true)}
                  className="gap-1.5"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Editar
                </Button>
              )}
              {canAnular && (
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => setDeleteOpen(true)}
                  className="gap-1.5"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Anular
                </Button>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Details grid */}
      <div
        className="dash-rise grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3"
        style={{ animationDelay: "140ms" }}
      >
        <InfoRow icon={User} label="Cliente" value={pago.clientes?.nombre ?? "—"} />
        <InfoRow icon={CreditCard} label="Cobrador" value={pago.cobrador_nombre ?? "—"} />

        {pago.cuota && (
          <InfoRow
            icon={FileText}
            label="Cuota"
            value={`N° ${pago.cuota.numero_cuota} · esperado ${formatCop(pago.cuota.monto_esperado)}`}
          />
        )}

        {pago.prestamo && (
          <InfoRow
            icon={Banknote}
            label="Préstamo"
            value={`${formatCop(pago.prestamo.capital)} · ${pago.prestamo.tasa_mensual}% mensual`}
          />
        )}

        <InfoRow
          icon={Calendar}
          label="Registrado"
          value={new Date(pago.created_at).toLocaleDateString("es-CO")}
        />

        {pago.nota && (
          <InfoRow icon={MessageSquare} label="Nota" value={pago.nota} />
        )}

        {pago.lat != null && pago.lng != null && (
          <InfoRow
            icon={MapPin}
            label="Ubicación"
            value={`${pago.lat.toFixed(5)}, ${pago.lng.toFixed(5)}`}
          />
        )}
      </div>

      {/* Edit dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} title="Editar pago">
        <EditPagoForm
          pago={pago}
          onSuccess={() => {
            setEditOpen(false);
            void queryClient.invalidateQueries({ queryKey: ["pagos", id] });
          }}
          onCancel={() => setEditOpen(false)}
        />
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Anular pago">
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-lg bg-danger/10 border border-danger/20 p-3">
            <AlertCircle className="h-5 w-5 text-danger mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="font-semibold text-foreground">Esta acción reversa el saldo del préstamo</p>
              <p className="mt-1 text-muted-foreground">
                Se eliminará el pago de {formatCop(pago.monto)} y se ajustará el saldo
                pendiente del préstamo. Esta operación no se puede deshacer.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setDeleteOpen(false)} className="flex-1">
              Cancelar
            </Button>
            <Button variant="danger" loading={deleting} onClick={handleDelete} className="flex-1">
              Anular pago
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <Card padding="md" className="flex items-start gap-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
          {label}
        </p>
        <p className="mt-1 break-words text-sm font-medium text-foreground">{value}</p>
      </div>
    </Card>
  );
}

type EditPagoFormProps = {
  pago: { id: string; medio_pago: string; nota: string | null };
  onSuccess: () => void;
  onCancel: () => void;
};

function EditPagoForm({ pago, onSuccess, onCancel }: EditPagoFormProps) {
  const [medioPago, setMedioPago] = useState(pago.medio_pago);
  const [nota, setNota] = useState(pago.nota ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    const res = await fetch(`/api/pagos/${pago.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ medioPago: medioPago, nota: nota || undefined }),
    });
    setSaving(false);
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      toast.error(json.error?.message ?? "Error al actualizar pago");
      return;
    }
    toast.success("Pago actualizado");
    onSuccess();
  }

  return (
    <div className="space-y-4">
      <Select
        label="Método de pago"
        options={MEDIOS_PAGO}
        value={medioPago}
        onChange={(e) => setMedioPago(e.target.value)}
      />
      <Input
        label="Nota"
        placeholder="Observaciones sobre el pago..."
        value={nota}
        onChange={(e) => setNota(e.target.value)}
      />
      <div className="flex gap-3 pt-2">
        <Button variant="outline" onClick={onCancel} className="flex-1">
          Cancelar
        </Button>
        <Button loading={saving} onClick={handleSave} className="flex-1">
          Guardar cambios
        </Button>
      </div>
    </div>
  );
}
