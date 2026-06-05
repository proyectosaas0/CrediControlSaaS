import { z } from "zod";

export const clienteSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio"),
  cedula: z.string().trim().optional(),
  telefono: z
    .string()
    .trim()
    .min(1, "El telefono es obligatorio")
    .regex(/^\+?[\d\s-]{7,15}$/, "Telefono invalido"),
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

export const prestamoStep2Schema = z.object({
  capital: z.number().positive("El capital debe ser mayor a 0"),
  modeloInteres: z.enum(["cuota_fija", "solo_interes", "sobre_saldo"], {
    message: "Selecciona un modelo de interes",
  }),
  tasaMensual: z
    .number()
    .min(0, "La tasa no puede ser negativa")
    .max(100, "La tasa maxima es 100%"),
  plazoDias: z
    .number()
    .int("El plazo debe ser un numero entero")
    .min(1, "El plazo minimo es 1 dia")
    .max(365, "El plazo maximo es 365 dias"),
  fechaInicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha invalida"),
  excluirSabados: z.boolean(),
  excluirDomingos: z.boolean(),
  cobradorId: z.string().uuid().nullable().optional(),
});

export type PrestamoStep2Data = z.infer<typeof prestamoStep2Schema>;

export const cobradorSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio"),
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
