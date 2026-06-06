"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Phone, CheckCircle, XCircle } from "lucide-react";
import { cobradorSchema, type CobradorFormData } from "@/lib/schemas/admin";
import { useCobradores, type Cobrador } from "@/lib/hooks";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { formatCop } from "@/lib/domain/money";
import { toast } from "sonner";
import { cn } from "@/components/ui/cn";

export default function CobradoresPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data: cobradores = [], isPending, error } = useCobradores();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Cobradores</h1>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline ml-1">Agregar</span>
        </Button>
      </div>

      {isPending && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Cargando cobradores...</p>
        </div>
      )}

      {error && (
        <div className="bg-danger/10 border border-danger/20 rounded-lg p-4">
          <p className="text-danger text-sm">
            Error al cargar cobradores: {error.message}
          </p>
        </div>
      )}

      {!isPending && !error && (
        <div className="space-y-3">
          {cobradores.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">No hay cobradores registrados</p>
              <p className="text-xs text-muted-foreground mt-1">
                Agrega un cobrador para empezar a asignar rutas de cobro.
              </p>
            </div>
          ) : (
            cobradores.map((cobrador) => (
              <CobradorCard key={cobrador.id} cobrador={cobrador} />
            ))
          )}
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
    <Card padding="md">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-foreground">
              {cobrador.nombre}
            </p>
            <Badge variant={cobrador.activo ? "success" : "muted"}>
              {cobrador.activo ? "Activo" : "Inactivo"}
            </Badge>
          </div>
          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <Phone className="h-3 w-3" />
            {cobrador.telefono}
          </p>
        </div>
        <ToggleActiveButton
          cobradorId={cobrador.id}
          activo={cobrador.activo}
        />
      </div>

      {cobrador.activo && (
        <div className="mt-3 border-t border-border pt-3">
          <div>
            <p className="text-xs text-muted-foreground">Comisión</p>
            <p className="text-sm font-bold text-foreground">
              {cobrador.comision}%
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}

function ToggleActiveButton({
  activo,
}: {
  cobradorId: string;
  activo: boolean;
}) {
  return (
    <button
      onClick={() => {
        // TODO: Reemplazar por PATCH /api/cobradores/[id]
        toast.success(
          activo ? "Cobrador desactivado" : "Cobrador activado",
        );
      }}
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
    defaultValues: { nombre: "", telefono: "" },
  });

  async function onSubmit(data: CobradorFormData) {
    // TODO: Reemplazar por POST /api/cobradores (invitacion con organization_id)
    console.log("Crear cobrador:", data);
    toast.success("Cobrador agregado correctamente");
    onSuccess();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Nombre"
        placeholder="Juan Perez"
        error={errors.nombre?.message}
        required
        {...register("nombre")}
      />
      <Input
        label="Telefono"
        placeholder="+573001234567"
        error={errors.telefono?.message}
        required
        {...register("telefono")}
      />
      <p className="text-xs text-muted-foreground">
        Se enviara una invitacion al cobrador para que se registre con este
        telefono.
      </p>
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          Agregar cobrador
        </Button>
      </div>
    </form>
  );
}
