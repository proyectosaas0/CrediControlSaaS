"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Building2, Palette, MessageSquare, Percent, Clock } from "lucide-react";
import { MOCK_TENANT_SETTINGS } from "@/lib/mock/configuracion";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const configuracionSchema = z.object({
  nombreNegocio: z.string().trim().min(1, "El nombre del negocio es obligatorio"),
  ciudad: z.string().trim().optional(),
  telefono: z.string().trim().optional(),
  moraTipo: z.enum(["porcentaje", "monto_fijo"]),
  moraValor: z.number().min(0, "El valor no puede ser negativo"),
  diasGracia: z.number().int().min(0, "Los dias de gracia no pueden ser negativos"),
  tasaInteresDefault: z.number().min(0, "La tasa no puede ser negativa").max(100, "La tasa maxima es 100%"),
  cobrarSabados: z.boolean(),
  cobrarDomingos: z.boolean(),
  geolocalizacionRequerida: z.boolean(),
  moneda: z.enum(["COP", "USD"]),
  horarioInicio: z.string(),
  horarioFin: z.string(),
  whatsappTemplate: z.string().trim(),
  colorPrimario: z.string().min(1, "Selecciona un color"),
});

type ConfiguracionFormData = z.infer<typeof configuracionSchema>;

export default function ConfiguracionPage() {
  const settings = MOCK_TENANT_SETTINGS;

  const {
    register,
    handleSubmit,
    control,
    formState: { isSubmitting },
  } = useForm<ConfiguracionFormData>({
    resolver: zodResolver(configuracionSchema),
    defaultValues: {
      ...settings,
    },
  });

  const moraTipo = useWatch({ control, name: "moraTipo" });

  function onSubmit() {
    toast.success("Configuracion guardada correctamente");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Configuracion</h1>
        <Button size="sm" type="submit" form="form-configuracion" disabled={isSubmitting}>
          Guardar cambios
        </Button>
      </div>

      <form id="form-configuracion" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Informacion del negocio */}
        <Card padding="md">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Informacion del negocio</CardTitle>
          </div>
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

        {/* Politica de mora */}
        <Card padding="md">
          <div className="flex items-center gap-2 mb-4">
            <Percent className="h-5 w-5 text-warning" />
            <CardTitle className="text-base">Politica de mora</CardTitle>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Tipo de mora
              </label>
              <div className="flex gap-2">
                <label className="flex-1">
                  <input
                    type="radio"
                    value="porcentaje"
                    className="sr-only peer"
                    {...register("moraTipo")}
                  />
                  <span className="flex items-center justify-center h-10 rounded-lg border border-border bg-background text-sm peer-checked:border-primary peer-checked:bg-primary/10 peer-checked:text-primary peer-focus-visible:ring-2 peer-focus-visible:ring-ring cursor-pointer transition-colors">
                    Porcentaje (%)
                  </span>
                </label>
                <label className="flex-1">
                  <input
                    type="radio"
                    value="monto_fijo"
                    className="sr-only peer"
                    {...register("moraTipo")}
                  />
                  <span className="flex items-center justify-center h-10 rounded-lg border border-border bg-background text-sm peer-checked:border-primary peer-checked:bg-primary/10 peer-checked:text-primary peer-focus-visible:ring-2 peer-focus-visible:ring-ring cursor-pointer transition-colors">
                    Monto fijo ($)
                  </span>
                </label>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label={moraTipo === "porcentaje" ? "Valor de mora (%)" : "Valor de mora ($)"}
                type="number"
                {...register("moraValor", { valueAsNumber: true })}
              />
              <Input
                label="Dias de gracia"
                type="number"
                {...register("diasGracia", { valueAsNumber: true })}
              />
            </div>
          </div>
        </Card>

        {/* Preferencias operativas */}
        <Card padding="md">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5 text-info" />
            <CardTitle className="text-base">Preferencias operativas</CardTitle>
          </div>
          <div className="space-y-3">
            <Input
              label="Tasa de interes predeterminada (%)"
              type="number"
              step="0.1"
              {...register("tasaInteresDefault", { valueAsNumber: true })}
            />
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
        <Card padding="md">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="h-5 w-5 text-success" />
            <CardTitle className="text-base">Plantilla WhatsApp</CardTitle>
          </div>
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
        <Card padding="md">
          <div className="flex items-center gap-2 mb-4">
            <Palette className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Apariencia</CardTitle>
          </div>
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
