"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Plus, Phone, CheckCircle, XCircle, UserCircle } from "lucide-react";
import { cobradorSchema, type CobradorFormData } from "@/lib/schemas/admin";
import { useCobradores, type Cobrador } from "@/hooks/queries/use-cobradores";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { SkeletonList } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { toast } from "sonner";
import { cn } from "@/components/ui/cn";
import { PageHeader, staggerDelay } from "@/components/ui/page-header";

export default function CobradoresPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data: cobradores = [], isPending, error, refetch } = useCobradores();

  const activos = cobradores.filter((c) => c.activo).length;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Equipo"
        title="Cobradores"
        subtitle={
          isPending
            ? "Cargando equipo…"
            : `${activos} activo${activos !== 1 ? "s" : ""} de ${cobradores.length} en total`
        }
        actions={
          <Button size="sm" onClick={() => setDialogOpen(true)} className="gap-1.5">
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            <span className="hidden sm:inline">Agregar cobrador</span>
            <span className="sm:hidden">Agregar</span>
          </Button>
        }
      />

      {isPending ? (
        <SkeletonList count={3} />
      ) : error ? (
        <ErrorState message={error.message} onRetry={() => refetch()} />
      ) : cobradores.length === 0 ? (
        <EmptyState
          icon={UserCircle}
          title="Sin cobradores registrados"
          description="Agrega un cobrador para empezar a asignar rutas de cobro."
          action={<Button size="sm" onClick={() => setDialogOpen(true)} className="gap-1.5"><Plus className="h-4 w-4" />Agregar cobrador</Button>}
        />
      ) : (
        <div className="grid gap-2.5 lg:grid-cols-2">
          {cobradores.map((cobrador, i) => (
            <CobradorCard key={cobrador.id} cobrador={cobrador} index={i} />
          ))}
        </div>
      )}

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="Agregar cobrador"
      >
        <CobradorForm
          onSuccess={() => setDialogOpen(false)}
          onCancel={() => setDialogOpen(false)}
        />
      </Dialog>
    </div>
  );
}

function CobradorCard({ cobrador, index }: { cobrador: Cobrador; index: number }) {
  const initials = cobrador.nombre_completo.slice(0, 2).toUpperCase();

  return (
    <Link href={`/app/cobradores/${cobrador.id}`} className="block h-full">
      <Card
        padding="md"
        className="dash-rise group h-full cursor-pointer transition-all hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-lg hover:shadow-primary/5"
        style={staggerDelay(index)}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                cobrador.activo
                  ? "bg-success/15 text-success"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {initials}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
                  {cobrador.nombre_completo}
                </p>
                <Badge variant={cobrador.activo ? "success" : "muted"}>
                  {cobrador.activo ? "Activo" : "Inactivo"}
                </Badge>
              </div>
              {cobrador.telefono && (
                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <Phone className="h-3 w-3" />
                  {cobrador.telefono}
                </p>
              )}
            </div>
          </div>
          <ToggleActiveButton cobradorId={cobrador.id} activo={cobrador.activo} />
        </div>
      </Card>
    </Link>
  );
}

function ToggleActiveButton({
  cobradorId,
  activo,
}: {
  cobradorId: string;
  activo: boolean;
}) {
  const queryClient = useQueryClient();

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const res = await fetch(`/api/cobradores/${cobradorId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activo: !activo }),
    });
    if (!res.ok) {
      toast.error("No se pudo cambiar el estado del cobrador");
      return;
    }
    toast.success(activo ? "Cobrador desactivado" : "Cobrador activado");
    void queryClient.invalidateQueries({ queryKey: ["cobradores"] });
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        "flex min-h-11 min-w-11 items-center justify-center rounded-lg transition-colors",
        activo
          ? "text-danger hover:bg-danger/10"
          : "text-success hover:bg-success/10",
      )}
      aria-label={activo ? "Desactivar cobrador" : "Activar cobrador"}
    >
      {activo ? (
        <XCircle className="h-5 w-5" />
      ) : (
        <CheckCircle className="h-5 w-5" />
      )}
    </button>
  );
}

function CobradorForm({
  onSuccess,
  onCancel,
}: {
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CobradorFormData>({
    resolver: zodResolver(cobradorSchema),
    defaultValues: { nombre: "", email: "", telefono: "" },
  });

  const queryClient = useQueryClient();

  async function onSubmit(data: CobradorFormData) {
    const res = await fetch("/api/cobradores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(json.error?.message ?? "Error al agregar cobrador");
      return;
    }
    toast.success("Cobrador agregado correctamente");
    void queryClient.invalidateQueries({ queryKey: ["cobradores"] });
    onSuccess();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Nombre completo"
        placeholder="Juan Perez"
        error={errors.nombre?.message}
        required
        {...register("nombre")}
      />
      <Input
        label="Correo electronico"
        type="email"
        placeholder="cobrador@ejemplo.com"
        error={errors.email?.message}
        required
        {...register("email")}
      />
      <Input
        label="Telefono"
        placeholder="+573001234567"
        error={errors.telefono?.message}
        required
        {...register("telefono")}
      />
      <p className="text-xs text-muted-foreground">
        Se creara una cuenta para el cobrador con este correo.
      </p>
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancelar
        </Button>
        <Button type="submit" loading={isSubmitting} className="flex-1">
          Agregar cobrador
        </Button>
      </div>
    </form>
  );
}
