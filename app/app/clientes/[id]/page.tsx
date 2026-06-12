"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Phone, MapPin, FileText, Pencil, PowerOff, Power } from "lucide-react";
import { useCliente } from "@/hooks/queries/use-clientes";
import { usePrestamos } from "@/hooks/queries/use-prestamos";
import { clienteSchema, type ClienteFormData } from "@/lib/schemas/admin";
import { ScoreBadge } from "@/components/domain/score-badge";
import { LoanStatusBadge } from "@/components/domain/loan-status-badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { SectionHead, staggerDelay } from "@/components/ui/page-header";
import { formatCop } from "@/lib/domain/money";
import { toast } from "sonner";

export default function ClienteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const queryClient = useQueryClient();

  const { data: cliente, isLoading, error } = useCliente(id);
  const { data: prestamos = [] } = usePrestamos({ clienteId: id });

  const [editOpen, setEditOpen] = useState(false);
  const [togglingActivo, setTogglingActivo] = useState(false);

  if (isLoading) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  if (error || !cliente) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">Cliente no encontrado</p>
        <button onClick={() => router.back()} className="mt-4 text-sm text-primary underline">
          Volver
        </button>
      </div>
    );
  }

  const totalPrestado = prestamos.reduce((sum, p) => sum + p.capital, 0);
  const prestamosActivos = prestamos.filter((p) => p.estado === "activo" || p.estado === "en_mora");

  async function handleToggleActivo() {
    if (!cliente) return;
    setTogglingActivo(true);
    const res = await fetch(`/api/clientes/${id}`, {
      method: cliente.activo ? "DELETE" : "PATCH",
      headers: { "Content-Type": "application/json" },
      ...(!cliente.activo ? { body: JSON.stringify({ activo: true }) } : {}),
    });
    setTogglingActivo(false);
    if (!res.ok) {
      toast.error("No se pudo cambiar el estado del cliente");
      return;
    }
    toast.success(cliente.activo ? "Cliente desactivado" : "Cliente activado");
    void queryClient.invalidateQueries({ queryKey: ["clientes"] });
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
        {/* Left: info card */}
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
                    {cliente.nombre.slice(0, 2).toUpperCase()}
                  </div>
                  <span
                    className={`absolute -bottom-px -right-px h-3.5 w-3.5 rounded-full border-2 border-card ${cliente.activo ? "bg-success" : "bg-muted-foreground/50"}`}
                  />
                </div>
                <div>
                  <h1 className="font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                    {cliente.nombre}
                  </h1>
                  {cliente.cedula && (
                    <p className="text-sm text-muted-foreground tabular-nums">
                      CC {cliente.cedula}
                    </p>
                  )}
                </div>
              </div>
              <ScoreBadge score={cliente.score_pago} size="lg" />
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4 text-primary/70" />
                <span>{cliente.telefono}</span>
              </div>
              {cliente.direccion && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4 text-primary/70" />
                  <span>{cliente.direccion}{cliente.barrio ? ` · ${cliente.barrio}` : ""}</span>
                </div>
              )}
              {cliente.notas && (
                <div className="flex items-start gap-2 text-muted-foreground">
                  <FileText className="mt-0.5 h-4 w-4 text-primary/70" />
                  <span>{cliente.notas}</span>
                </div>
              )}
            </div>

            <div className="flex gap-2 border-t border-dashed border-border pt-3.5">
              <Button size="sm" variant="outline" onClick={() => setEditOpen(true)} className="gap-1.5">
                <Pencil className="h-3.5 w-3.5" />
                Editar
              </Button>
              <Button
                size="sm"
                variant={cliente.activo ? "danger" : "success"}
                onClick={handleToggleActivo}
                disabled={togglingActivo}
                className="gap-1.5"
              >
                {cliente.activo
                  ? <><PowerOff className="h-3.5 w-3.5" /> Desactivar</>
                  : <><Power className="h-3.5 w-3.5" /> Activar</>
                }
              </Button>
            </div>
          </div>
        </Card>

        {/* Right: stats */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
          <div
            className="dash-rise rounded-2xl border border-border bg-card p-4 backdrop-blur-sm"
            style={{ animationDelay: "120ms" }}
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              Total prestado
            </p>
            <p className="mt-1.5 font-display text-xl font-bold leading-none tracking-tight text-foreground tabular-nums">
              {formatCop(totalPrestado)}
            </p>
          </div>
          <div
            className="dash-rise rounded-2xl border border-border bg-card p-4 backdrop-blur-sm"
            style={{ animationDelay: "180ms" }}
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              Préstamos activos
            </p>
            <p className="mt-1.5 font-display text-xl font-bold leading-none tracking-tight text-foreground tabular-nums">
              {prestamosActivos.length}
            </p>
          </div>
        </div>
      </div>

      <section className="dash-rise" style={{ animationDelay: "240ms" }}>
        <SectionHead title="Historial de préstamos" count={prestamos.length} />
        {prestamos.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin préstamos registrados</p>
        ) : (
          <div className="space-y-2.5">
            {prestamos.map((prestamo, i) => (
              <Link key={prestamo.id} href={`/app/prestamos/${prestamo.id}`} className="block">
                <Card
                  padding="md"
                  className="dash-rise group transition-all hover:border-primary/35 hover:shadow-lg hover:shadow-primary/5"
                  style={staggerDelay(i)}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-display text-base font-bold tabular-nums text-foreground transition-colors group-hover:text-primary">
                        {formatCop(prestamo.capital)}
                      </p>
                      <p className="mt-0.5 text-xs capitalize text-muted-foreground">
                        {prestamo.modelo_interes.replace("_", " ")} · {prestamo.tasa_mensual}% mensual
                      </p>
                    </div>
                    <LoanStatusBadge estado={prestamo.estado} />
                  </div>
                  <div className="mt-2.5 flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="tabular-nums">
                      Cuota {prestamo.prestamo_saldos?.[0]?.cuotas_pagadas ?? 0}/{prestamo.prestamo_saldos?.[0]?.cuotas_totales ?? 0}
                    </span>
                    <span aria-hidden>·</span>
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

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} title="Editar cliente">
        <EditClienteForm
          cliente={cliente}
          onSuccess={() => {
            setEditOpen(false);
            void queryClient.invalidateQueries({ queryKey: ["clientes"] });
          }}
          onCancel={() => setEditOpen(false)}
        />
      </Dialog>
    </div>
  );
}

type EditClienteFormProps = {
  cliente: { id: string; nombre: string; cedula: string | null; telefono: string | null; direccion: string | null; barrio: string | null; notas: string | null };
  onSuccess: () => void;
  onCancel: () => void;
};

function EditClienteForm({ cliente, onSuccess, onCancel }: EditClienteFormProps) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ClienteFormData>({
    resolver: zodResolver(clienteSchema),
    defaultValues: {
      nombre: cliente.nombre,
      cedula: cliente.cedula ?? "",
      telefono: cliente.telefono ?? "",
      direccion: cliente.direccion ?? "",
      barrio: cliente.barrio ?? "",
      notas: cliente.notas ?? "",
    },
  });

  async function onSubmit(data: ClienteFormData) {
    const res = await fetch(`/api/clientes/${cliente.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(json.error?.message ?? "Error al actualizar cliente");
      return;
    }
    toast.success("Cliente actualizado correctamente");
    onSuccess();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input label="Nombre" error={errors.nombre?.message} required {...register("nombre")} />
      <Input label="Cedula" error={errors.cedula?.message} {...register("cedula")} />
      <Input label="Telefono" error={errors.telefono?.message} required {...register("telefono")} />
      <Input label="Direccion" error={errors.direccion?.message} {...register("direccion")} />
      <Input label="Barrio" error={errors.barrio?.message} {...register("barrio")} />
      <Input label="Notas" error={errors.notas?.message} {...register("notas")} />
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">Cancelar</Button>
        <Button type="submit" loading={isSubmitting} className="flex-1">
          Guardar cambios
        </Button>
      </div>
    </form>
  );
}
