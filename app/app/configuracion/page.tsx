"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Palette, MessageSquare, Clock } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthMe } from "@/hooks/queries/use-auth-me";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SkeletonList } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/ui/page-header";
import { cn } from "@/components/ui/cn";
import { organizacionSettingsSchema, type OrganizacionSettingsData } from "@/lib/schemas/admin";
import { toast } from "sonner";

function ConfigCardTitle({
  icon: Icon,
  chip,
  children,
}: {
  icon: React.ElementType;
  chip: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-center gap-2.5">
      <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg", chip)}>
        <Icon className="h-4 w-4" />
      </span>
      <h3 className="font-display text-base font-bold tracking-tight text-foreground">
        {children}
      </h3>
    </div>
  );
}

export default function ConfiguracionPage() {
  const { data: me, isLoading } = useAuthMe();
  const org = me?.organization;
  const queryClient = useQueryClient();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
  } = useForm<OrganizacionSettingsData>({
    resolver: zodResolver(organizacionSettingsSchema),
    defaultValues: {
      nombreNegocio: "",
      ciudad: "",
      telefono: "",
      horarioInicio: "",
      horarioFin: "",
      moneda: "COP",
      cobrarSabados: true,
      cobrarDomingos: false,
      geolocalizacionRequerida: false,
      whatsappTemplate: "",
      colorPrimario: "#1d4ed8",
    },
  });

  useEffect(() => {
    if (org) {
      reset({
        nombreNegocio: org.nombre_negocio ?? "",
        ciudad: org.ciudad ?? "",
        telefono: org.telefono ?? "",
        horarioInicio: org.horario_inicio ?? "",
        horarioFin: org.horario_fin ?? "",
        moneda: (org.moneda as "COP" | "USD") ?? "COP",
        cobrarSabados: org.cobrar_sabados,
        cobrarDomingos: org.cobrar_domingos,
        geolocalizacionRequerida: org.geolocalizacion_requerida,
        whatsappTemplate: org.whatsapp_template ?? "",
        colorPrimario: org.color_primario ?? "#1d4ed8",
      });
    }
  }, [org, reset]);

  async function onSubmit(data: OrganizacionSettingsData) {
    setSubmitting(true);
    try {
      const res = await fetch("/api/organizacion", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const message =
          (body as { error?: { message?: string }; message?: string }).error?.message ??
          (body as { message?: string }).message ??
          "No se pudo guardar la configuracion";
        throw new Error(message);
      }
      toast.success("Configuracion guardada correctamente");
      await queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar la configuracion");
    } finally {
      setSubmitting(false);
    }
  }

  if (isLoading) return <SkeletonList count={6} />;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Ajustes"
        title="Configuración"
        subtitle="Personaliza la operación de tu negocio"
        actions={
          <Button size="sm" type="submit" form="form-configuracion" loading={submitting}>
            Guardar cambios
          </Button>
        }
      />

      <form id="form-configuracion" onSubmit={handleSubmit(onSubmit)} className="space-y-6 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-6">
        {/* Informacion del negocio */}
        <Card padding="md" className="dash-rise" style={{ animationDelay: "60ms" }}>
          <ConfigCardTitle icon={Building2} chip="bg-primary/15 text-primary">
            Información del negocio
          </ConfigCardTitle>
          <div className="space-y-3">
            <Input
              label="Nombre del negocio"
              placeholder="CrediPrestamos del Valle"
              {...register("nombreNegocio")}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Ciudad"
                placeholder="Cali"
                {...register("ciudad")}
              />
              <Input
                label="Telefono"
                placeholder="+573001234567"
                {...register("telefono")}
              />
            </div>
          </div>
        </Card>

        {/* Preferencias operativas */}
        <Card padding="md" className="dash-rise" style={{ animationDelay: "120ms" }}>
          <ConfigCardTitle icon={Clock} chip="bg-info/15 text-info">
            Preferencias operativas
          </ConfigCardTitle>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Horario inicio"
                type="time"
                {...register("horarioInicio")}
              />
              <Input
                label="Horario fin"
                type="time"
                {...register("horarioFin")}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Moneda
              </label>
              <div className="flex gap-2">
                <label className="flex-1">
                  <input
                    type="radio"
                    value="COP"
                    className="sr-only peer"
                    {...register("moneda")}
                  />
                  <span className="flex items-center justify-center h-10 rounded-lg border border-border bg-background text-sm peer-checked:border-primary peer-checked:bg-primary/10 peer-checked:text-primary peer-focus-visible:ring-2 peer-focus-visible:ring-ring cursor-pointer transition-colors">
                    COP ($)
                  </span>
                </label>
                <label className="flex-1">
                  <input
                    type="radio"
                    value="USD"
                    className="sr-only peer"
                    {...register("moneda")}
                  />
                  <span className="flex items-center justify-center h-10 rounded-lg border border-border bg-background text-sm peer-checked:border-primary peer-checked:bg-primary/10 peer-checked:text-primary peer-focus-visible:ring-2 peer-focus-visible:ring-ring cursor-pointer transition-colors">
                    USD ($)
                  </span>
                </label>
              </div>
            </div>
            <div className="space-y-2">
              <label className="flex items-center justify-between">
                <span className="text-sm text-foreground">Cobrar sabados</span>
                <input
                  type="checkbox"
                  className="h-5 w-5 rounded border-border text-primary focus:ring-primary"
                  {...register("cobrarSabados")}
                />
              </label>
              <label className="flex items-center justify-between">
                <span className="text-sm text-foreground">Cobrar domingos</span>
                <input
                  type="checkbox"
                  className="h-5 w-5 rounded border-border text-primary focus:ring-primary"
                  {...register("cobrarDomingos")}
                />
              </label>
              <label className="flex items-center justify-between">
                <div>
                  <span className="text-sm text-foreground">Geolocalizacion requerida</span>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Guarda ubicacion al registrar pagos
                  </p>
                </div>
                <input
                  type="checkbox"
                  className="h-5 w-5 rounded border-border text-primary focus:ring-primary"
                  {...register("geolocalizacionRequerida")}
                />
              </label>
            </div>
          </div>
        </Card>

        {/* Plantilla WhatsApp */}
        <Card padding="md" className="dash-rise lg:col-span-2" style={{ animationDelay: "180ms" }}>
          <ConfigCardTitle icon={MessageSquare} chip="bg-success/15 text-success">
            Plantilla WhatsApp
          </ConfigCardTitle>
          <div className="space-y-2">
            <textarea
              className="flex min-h-[100px] w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
              placeholder="Hola {cliente}, tu pago de {monto} por el prestamo {prestamo_id} ha sido registrado."
              {...register("whatsappTemplate")}
            />
            <p className="text-xs text-muted-foreground">
              Variables disponibles: {'{cliente}'}, {'{monto}'}, {'{prestamo_id}'}, {'{negocio}'}
            </p>
          </div>
        </Card>

        {/* Apariencia */}
        <Card padding="md" className="dash-rise" style={{ animationDelay: "240ms" }}>
          <ConfigCardTitle icon={Palette} chip="bg-primary/15 text-primary">
            Apariencia
          </ConfigCardTitle>
          <div className="flex items-center gap-3">
            <input
              type="color"
              className="h-10 w-10 rounded-lg border border-border cursor-pointer"
              {...register("colorPrimario")}
            />
            <div>
              <p className="text-sm font-medium text-foreground">Color primario</p>
              <p className="text-xs text-muted-foreground">
                Se usara en botones, enlaces y elementos destacados.
              </p>
            </div>
          </div>
        </Card>
      </form>
    </div>
  );
}
