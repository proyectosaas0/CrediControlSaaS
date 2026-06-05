import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Ingresa un correo valido"),
  password: z.string().min(6, "La contrasena debe tener al menos 6 caracteres"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  nombre_completo: z
    .string()
    .min(3, "El nombre debe tener al menos 3 caracteres"),
  nombre_negocio: z
    .string()
    .min(2, "El nombre del negocio debe tener al menos 2 caracteres"),
  ciudad: z.string().min(2, "Ingresa la ciudad de tu negocio"),
  telefono: z
    .string()
    .min(7, "Ingresa un telefono valido")
    .regex(/^\+?\d[\d\s-]{6,}$/, "Formato de telefono invalido"),
  email: z.email("Ingresa un correo valido"),
  password: z
    .string()
    .min(8, "La contrasena debe tener al menos 8 caracteres"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contrasenas no coinciden",
  path: ["confirmPassword"],
});

export type RegisterInput = z.infer<typeof registerSchema>;
