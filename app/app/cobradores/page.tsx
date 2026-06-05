"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Phone, CheckCircle, XCircle } from "lucide-react";
import { cobradorSchema, type CobradorFormData } from "@/lib/schemas/admin";
import { MOCK_COBRADORES, type MockCobrador } from "@/lib/mock/admin";
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Cobradores</h1>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline ml-1">Agregar</span>
        </Button>
      </div>

      <div className="space-y-3">
        {MOCK_COBRADORES.map((cobrador) => (
          <CobradorCard key={cobrador.id} cobrador={cobrador} />
        ))}
      </div>

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

function CobradorCard({ cobrador }: { cobrador: MockCobrador }) {
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
        <div className="mt-3 grid grid-cols-3 gap-2 border-t border-border pt-3">
          <div>
            <p className="text-xs text-muted-foreground">Cobros hoy</p>
            <p className="text-sm font-bold text-foreground">
              {cobrador.cobrosHoy}/{cobrador.cobrosTotales}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Recaudado</p>
            <p className="text-sm font-bold font-mono text-foreground">
              {formatCop(cobrador.recaudadoHoy)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Cumplimiento</p>
            <p className="text-sm font-bold text-foreground">
              {cobrador.cobrosTotales > 0
                ? Math.round((cobrador.cobrosHoy / cobrador.cobrosTotales) * 100)
                : 0}
              %
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
