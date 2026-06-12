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
    <div className="space-y-5">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver
      </button>

      <div className="grid gap-5 lg:grid-cols-[1fr_220px] lg:items-start">
        {/* Left: info card */}
        <Card padding="md">
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-xl font-bold text-foreground">{cliente.nombre}</h1>
                {cliente.cedula && (
                  <p className="text-sm text-muted-foreground">CC {cliente.cedula}</p>
                )}
              </div>
              <ScoreBadge score={cliente.score_pago} size="lg" />
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>{cliente.telefono}</span>
              </div>
              {cliente.direccion && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{cliente.direccion}{cliente.barrio ? ` · ${cliente.barrio}` : ""}</span>
                </div>
              )}
              {cliente.notas && (
                <div className="flex items-start gap-2 text-muted-foreground">
                  <FileText className="h-4 w-4 mt-0.5" />
                  <span>{cliente.notas}</span>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-1">
              <Button size="sm" variant="outline" onClick={() => setEditOpen(true)} className="flex items-center gap-1">
                <Pencil className="h-3.5 w-3.5" />
                Editar
              </Button>
              <Button
                size="sm"
                variant={cliente.activo ? "danger" : "success"}
                onClick={handleToggleActivo}
                disabled={togglingActivo}
                className="flex items-center gap-1"
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
          <Card padding="md">
            <p className="text-xs text-muted-foreground">Total prestado</p>
            <p className="text-lg font-bold font-mono text-foreground">{formatCop(totalPrestado)}</p>
          </Card>
          <Card padding="md">
            <p className="text-xs text-muted-foreground">Prestamos activos</p>
            <p className="text-lg font-bold text-foreground">{prestamosActivos.length}</p>
          </Card>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-foreground mb-3">Historial de prestamos</h2>
        {prestamos.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin prestamos registrados</p>
        ) : (
          <div className="space-y-3">
            {prestamos.map((prestamo) => (
              <Link key={prestamo.id} href={`/app/prestamos/${prestamo.id}`}>
                <Card padding="md" className="mb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{formatCop(prestamo.capital)}</p>
                      <p className="text-xs text-muted-foreground">
                        {prestamo.modelo_interes.replace("_", " ")} · {prestamo.tasa_mensual}% mensual
                      </p>
                    </div>
                    <LoanStatusBadge estado={prestamo.estado} />
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Cuota {prestamo.prestamo_saldos?.[0]?.cuotas_pagadas ?? 0}/{prestamo.prestamo_saldos?.[0]?.cuotas_totales ?? 0}</span>
                    <span>·</span>
                    <span>{formatCop(prestamo.prestamo_saldos?.[0]?.saldo_pendiente ?? 0)} pendiente</span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

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
