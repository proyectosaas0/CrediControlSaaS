import { z } from "zod";

export const clienteSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio"),
  cedula: z.string().trim().optional(),
  telefono: z
    .string()
    .trim()
    .optional()
    .refine((val) => !val || /^\+?[\d\s-]{7,15}$/.test(val), {
      message: "Telefono invalido",
    }),
  direccion: z.string().trim().optional(),
  barrio: z.string().trim().optional(),
  notas: z.string().trim().optional(),
});

export type ClienteFormData = z.infer<typeof clienteSchema>;

export const updateClienteSchema = clienteSchema.partial();

export type UpdateClienteFormData = z.infer<typeof updateClienteSchema>;

export const prestamoStep1Schema = z.object({
  clienteId: z.string().uuid("Selecciona un cliente"),
});

export type PrestamoStep1Data = z.infer<typeof prestamoStep1Schema>;

export const DIAS_COBRO = [
  "lunes",
  "martes",
  "miercoles",
  "jueves",
  "viernes",
  "sabado",
  "domingo",
] as const;

export const DIA_COBRO_LABELS: Record<(typeof DIAS_COBRO)[number], string> = {
  lunes: "Lunes",
  martes: "Martes",
  miercoles: "Miércoles",
  jueves: "Jueves",
  viernes: "Viernes",
  sabado: "Sábado",
  domingo: "Domingo",
};

// A dia_cobro value is either a weekday name (cobro semanal) or a
// day-of-month number as a string, e.g. "15" (cobro quincenal/mensual).
export const diaCobroValue = z.union([
  z.enum(DIAS_COBRO),
  z.string().regex(/^([1-9]|[12][0-9]|3[01])$/, "Día del mes inválido"),
]);

export function diaCobroLabel(value: string): string {
  if ((DIAS_COBRO as readonly string[]).includes(value)) {
    return DIA_COBRO_LABELS[value as (typeof DIAS_COBRO)[number]];
  }
  return `Día ${value}`;
}

export const prestamoStep2Schema = z.object({
  capital: z
    .number({ error: "Ingresa un monto valido" })
    .positive("El capital debe ser mayor a 0"),
  modeloInteres: z.enum(["cuota_fija", "solo_interes", "sobre_saldo"], {
    message: "Selecciona un modelo de interes",
  }),
  tasaMensual: z
    .number({ error: "Ingresa una tasa valida" })
    .min(0, "La tasa no puede ser negativa")
    .max(100, "La tasa maxima es 100%"),
  plazoDias: z
    .number({ error: "Ingresa un numero de dias valido" })
    .int("El plazo debe ser un numero entero")
    .min(1, "El plazo minimo es 1 dia")
    .max(365, "El plazo maximo es 365 dias"),
  fechaInicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha invalida"),
  excluirSabados: z.boolean(),
  excluirDomingos: z.boolean(),
  cobradorId: z.union([z.string().uuid(), z.literal(""), z.null()]).optional(),
  diaCobro: z.array(diaCobroValue).nullable().optional(),
});

export type PrestamoStep2Data = z.infer<typeof prestamoStep2Schema>;

export const editarPrestamoSchema = z.object({
  clienteId: z.string().uuid("Selecciona un cliente"),
  capital: z
    .number({ error: "Ingresa un monto valido" })
    .positive("El capital debe ser mayor a 0"),
  modeloInteres: z.enum(["cuota_fija", "solo_interes", "sobre_saldo"], {
    message: "Selecciona un modelo de interes",
  }),
  tasaMensual: z
    .number({ error: "Ingresa una tasa valida" })
    .min(0, "La tasa no puede ser negativa")
    .max(100, "La tasa maxima es 100%"),
  plazoDias: z
    .number({ error: "Ingresa un numero de dias valido" })
    .int("El plazo debe ser un numero entero")
    .min(1, "El plazo minimo es 1 dia")
    .max(365, "El plazo maximo es 365 dias"),
  fechaInicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha invalida"),
  excluirSabados: z.boolean(),
  excluirDomingos: z.boolean(),
  cobradorId: z.union([z.string().uuid(), z.literal(""), z.null()]).optional(),
  diaCobro: z.array(diaCobroValue).nullable().optional(),
});

export type EditarPrestamoData = z.infer<typeof editarPrestamoSchema>;

export const cobradorSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio"),
  email: z.email("Ingresa un correo valido"),
  telefono: z
    .string()
    .trim()
    .min(1, "El telefono es obligatorio")
    .regex(/^\+?[\d\s-]{7,15}$/, "Telefono invalido"),
});

export type CobradorFormData = z.infer<typeof cobradorSchema>;

export const cancelarPrestamoSchema = z.object({
  motivo: z.string().trim().min(3, "El motivo debe tener al menos 3 caracteres"),
});

export type CancelarPrestamoData = z.infer<typeof cancelarPrestamoSchema>;
