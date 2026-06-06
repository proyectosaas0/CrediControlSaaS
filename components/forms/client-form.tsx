"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { clienteSchema, type ClienteFormData } from "@/lib/schemas/admin";
import { apiClient } from "@/lib/api/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type ClientFormProps = {
  onSuccess: () => void;
  onCancel: () => void;
};

export function ClientForm({ onSuccess, onCancel }: ClientFormProps) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ClienteFormData>({
    resolver: zodResolver(clienteSchema),
    defaultValues: {
      nombre: "",
      cedula: "",
      telefono: "",
      direccion: "",
      barrio: "",
      notas: "",
    },
  });

  const mutation = useMutation({
    mutationFn: (data: ClienteFormData) => apiClient.post('/clientes', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      toast.success("Cliente creado correctamente");
      onSuccess();
    },
    onError: (err: Error) => {
      toast.error(err.message || "Error al crear cliente");
    },
  });

  async function onSubmit(data: ClienteFormData) {

    try {
      await apiClient.post("/clientes", data);
      toast.success("Cliente creado correctamente");
      onSuccess();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al crear cliente");
    }

    mutation.mutate(data);

  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Nombre"
        placeholder="Maria Garcia"
        error={errors.nombre?.message}
        required
        {...register("nombre")}
      />
      <Input
        label="Cedula"
        placeholder="12345678"
        error={errors.cedula?.message}
        {...register("cedula")}
      />
      <Input
        label="Telefono"
        placeholder="+573001111111"
        error={errors.telefono?.message}
        required
        {...register("telefono")}
      />
      <Input
        label="Direccion"
        placeholder="Cra 5 #10-20"
        error={errors.direccion?.message}
        {...register("direccion")}
      />
      <Input
        label="Barrio"
        placeholder="Barrio Centro"
        error={errors.barrio?.message}
        {...register("barrio")}
      />
      <Input
        label="Notas"
        placeholder="Notas sobre el cliente..."
        error={errors.notas?.message}
        {...register("notas")}
      />

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting || mutation.isPending} className="flex-1">
          {mutation.isPending ? "Creando..." : "Crear cliente"}
        </Button>
      </div>
    </form>
  );
}
