"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { clienteSchema, type ClienteFormData } from "@/lib/schemas/admin";
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
    defaultValues: { nombre: "", cedula: "", telefono: "", direccion: "", barrio: "", notas: "" },
  });

  async function onSubmit(data: ClienteFormData) {
    const res = await fetch("/api/clientes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(json.error?.message ?? "Error al crear cliente");
      return;
    }
    void queryClient.invalidateQueries({ queryKey: ["clientes"] });
    toast.success("Cliente creado correctamente");
    onSuccess();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input label="Nombre" placeholder="Maria Garcia" error={errors.nombre?.message} required {...register("nombre")} />
      <Input label="Cedula" placeholder="12345678" error={errors.cedula?.message} {...register("cedula")} />
      <Input label="Telefono" placeholder="+573001111111" error={errors.telefono?.message} {...register("telefono")} />
      <Input label="Direccion" placeholder="Cra 5 #10-20" error={errors.direccion?.message} {...register("direccion")} />
      <Input label="Barrio" placeholder="Barrio Centro" error={errors.barrio?.message} {...register("barrio")} />
      <Input label="Notas" placeholder="Notas sobre el cliente..." error={errors.notas?.message} {...register("notas")} />
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">Cancelar</Button>
        <Button type="submit" loading={isSubmitting} className="flex-1">
          Crear cliente
        </Button>
      </div>
    </form>
  );
}
