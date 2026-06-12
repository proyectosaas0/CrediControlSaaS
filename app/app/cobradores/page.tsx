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

export default function CobradoresPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data: cobradores = [], isPending, error, refetch } = useCobradores();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Cobradores</h1>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline ml-1">Agregar</span>
        </Button>
      </div>

      {isPending ? (
        <SkeletonList count={3} />
      ) : error ? (
        <ErrorState message={error.message} onRetry={() => refetch()} />
      ) : cobradores.length === 0 ? (
        <EmptyState
          icon={UserCircle}
          title="Sin cobradores registrados"
          description="Agrega un cobrador para empezar a asignar rutas de cobro."
          action={<Button size="sm" onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4" />Agregar cobrador</Button>}
        />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {cobradores.map((cobrador) => (
            <CobradorCard key={cobrador.id} cobrador={cobrador} />
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

function CobradorCard({ cobrador }: { cobrador: Cobrador }) {
  return (
    <Link href={`/app/cobradores/${cobrador.id}`}>
      <Card padding="md" className="cursor-pointer hover:border-primary/30 transition-colors">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-foreground">
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
