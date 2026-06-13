"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Phone, Pencil, PowerOff, Power, Banknote } from "lucide-react";
import { useCobrador } from "@/hooks/queries/use-cobradores";
import { usePrestamos } from "@/hooks/queries/use-prestamos";
import { LoanStatusBadge } from "@/components/domain/loan-status-badge";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { SectionHead, staggerDelay } from "@/components/ui/page-header";
import { formatCop } from "@/lib/domain/money";
import { toast } from "sonner";

const editSchema = z.object({
  nombre_completo: z.string().trim().min(1, "El nombre es obligatorio"),
  telefono: z
    .string()
    .trim()
    .min(1, "El teléfono es obligatorio")
    .regex(/^\+?[\d\s-]{7,15}$/, "Teléfono inválido"),
});
type EditFormData = z.infer<typeof editSchema>;

export default function CobradorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const queryClient = useQueryClient();

  const { data: cobrador, isLoading, error } = useCobrador(id);
  const { data: prestamos = [] } = usePrestamos({ cobradorId: id });

  const [editOpen, setEditOpen] = useState(false);
  const [toggling, setToggling] = useState(false);

  if (isLoading) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  if (error || !cobrador) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">Cobrador no encontrado</p>
        <button onClick={() => router.back()} className="mt-4 text-sm text-primary underline">
          Volver
        </button>
      </div>
    );
  }

  const prestamosActivos = prestamos.filter(
    (p) => p.estado === "activo" || p.estado === "en_mora",
  );

  async function handleToggleActivo() {
    if (!cobrador) return;
    setToggling(true);
    const res = await fetch(`/api/cobradores/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activo: !cobrador.activo }),
    });
    setToggling(false);
    if (!res.ok) {
      toast.error("No se pudo cambiar el estado del cobrador");
      return;
    }
    toast.success(cobrador.activo ? "Cobrador desactivado" : "Cobrador activado");
    void queryClient.invalidateQueries({ queryKey: ["cobradores"] });
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => router.back()}
        className="dash-rise group flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
        Volver
      </button>

      <div className="grid gap-4 lg:grid-cols-[1fr_240px] lg:items-start">
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
                "radial-gradient(ellipse 70% 60% at 10% 0%, color-mix(in srgb, var(--primary) 8%, transparent), transparent 60%)",
            }}
          />
          <div className="relative space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <div className="relative shrink-0">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary to-violet-600 font-display text-base font-bold text-white shadow-lg shadow-primary/25">
                    {cobrador.nombre_completo.slice(0, 2).toUpperCase()}
                  </div>
                  <span
                    className={`absolute -bottom-px -right-px h-3.5 w-3.5 rounded-full border-2 border-card ${cobrador.activo ? "bg-success" : "bg-muted-foreground/50"}`}
                  />
                </div>
                <div>
                  <h1 className="font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                    {cobrador.nombre_completo}
                  </h1>
                  <p className="text-sm text-muted-foreground">Cobrador</p>
                </div>
              </div>
              <Badge variant={cobrador.activo ? "success" : "muted"}>
                {cobrador.activo ? "Activo" : "Inactivo"}
              </Badge>
            </div>

            {cobrador.telefono && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4 text-primary/70" />
                <span>{cobrador.telefono}</span>
              </div>
            )}

            <div className="flex gap-2 border-t border-dashed border-border pt-3.5">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditOpen(true)}
                className="gap-1.5"
              >
                <Pencil className="h-3.5 w-3.5" />
                Editar
              </Button>
              <Button
                size="sm"
                variant={cobrador.activo ? "danger" : "success"}
                onClick={handleToggleActivo}
                disabled={toggling}
                className="gap-1.5"
              >
                {cobrador.activo ? (
                  <><PowerOff className="h-3.5 w-3.5" /> Desactivar</>
                ) : (
                  <><Power className="h-3.5 w-3.5" /> Activar</>
                )}
              </Button>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
          <div
            className="dash-rise rounded-2xl border border-border bg-card p-4 backdrop-blur-sm"
            style={{ animationDelay: "120ms" }}
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              Préstamos activos
            </p>
            <p className="mt-1.5 font-display text-xl font-bold leading-none tabular-nums text-foreground">
              {prestamosActivos.length}
            </p>
          </div>
          <div
            className="dash-rise rounded-2xl border border-border bg-card p-4 backdrop-blur-sm"
            style={{ animationDelay: "180ms" }}
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              Total asignado
            </p>
            <p className="mt-1.5 truncate font-display text-xl font-bold leading-none tabular-nums text-foreground">
              {formatCop(prestamosActivos.reduce((s, p) => s + p.capital, 0))}
            </p>
          </div>
        </div>
      </div>

      <section className="dash-rise" style={{ animationDelay: "240ms" }}>
        <SectionHead title="Préstamos asignados" count={prestamos.length} />
        {prestamos.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin préstamos asignados</p>
        ) : (
          <div className="space-y-2.5">
            {prestamos.map((prestamo, i) => (
              <Link key={prestamo.id} href={`/app/prestamos/${prestamo.id}`} className="block">
                <Card
                  padding="md"
                  className="dash-rise group cursor-pointer transition-all hover:border-primary/35 hover:shadow-lg hover:shadow-primary/5"
                  style={staggerDelay(i)}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
                        {prestamo.clientes?.nombre ?? "—"}
                      </p>
                      <p className="mt-0.5 text-xs capitalize text-muted-foreground tabular-nums">
                        {formatCop(prestamo.capital)} · {prestamo.modelo_interes.replace("_", " ")}
                      </p>
                    </div>
                    <LoanStatusBadge estado={prestamo.estado} />
                  </div>
                  <div className="mt-2.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Banknote className="h-3 w-3" />
                    <span className="tabular-nums">
                      {formatCop(prestamo.prestamo_saldos?.[0]?.saldo_pendiente ?? 0)} pendiente
                    </span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} title="Editar cobrador">
        <EditCobradorForm
          cobrador={cobrador}
          onSuccess={() => {
            setEditOpen(false);
            void queryClient.invalidateQueries({ queryKey: ["cobradores"] });
          }}
          onCancel={() => setEditOpen(false)}
        />
      </Dialog>
    </div>
  );
}

type EditCobradorFormProps = {
  cobrador: { id: string; nombre_completo: string; telefono: string | null };
  onSuccess: () => void;
  onCancel: () => void;
};

function EditCobradorForm({ cobrador, onSuccess, onCancel }: EditCobradorFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      nombre_completo: cobrador.nombre_completo,
      telefono: cobrador.telefono ?? "",
    },
  });

  async function onSubmit(data: EditFormData) {
    const res = await fetch(`/api/cobradores/${cobrador.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(json.error?.message ?? "Error al actualizar cobrador");
      return;
    }
    toast.success("Cobrador actualizado correctamente");
    onSuccess();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Nombre completo"
        error={errors.nombre_completo?.message}
        required
        {...register("nombre_completo")}
      />
      <Input
        label="Teléfono"
        error={errors.telefono?.message}
        required
        {...register("telefono")}
      />
      <p className="text-xs text-muted-foreground">
        Para cambiar el correo electrónico, usa el módulo de Usuarios.
      </p>
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancelar
        </Button>
        <Button type="submit" loading={isSubmitting} className="flex-1">
          Guardar cambios
        </Button>
      </div>
    </form>
  );
}
