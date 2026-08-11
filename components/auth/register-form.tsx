"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import { registerSchema, type RegisterInput } from "@/lib/schemas/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Select } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { UserPlus, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { es } from "@/lib/i18n/es";
import { MUNICIPIOS_COLOMBIA } from "@/lib/data/municipios-colombia";

export function RegisterForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      nombre_completo: "",
      nombre_negocio: "",
      ciudad: "",
      telefono: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(data: RegisterInput) {
    setServerError(null);
    const supabase = createClient();

    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          nombre_completo: data.nombre_completo,
          nombre_negocio: data.nombre_negocio,
          ciudad: data.ciudad,
          telefono: data.telefono,
        },
      },
    });

    if (error) {
      if (error.message.includes("already registered")) {
        setServerError("Este correo ya esta registrado. Intenta iniciar sesion.");
      } else {
        setServerError(error.message);
      }
      return;
    }

    router.push("/verify");
  }

  return (
    <>
      <div className="mb-6 text-center">
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          {es.auth.register}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {es.register.comenzarGratis} — digitaliza tu cobranza en minutos
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input
            label={es.register.nombreCompleto}
            autoComplete="name"
            placeholder="Juan Perez"
            error={errors.nombre_completo?.message}
            {...register("nombre_completo")}
          />

          <Input
            label={es.register.nombreNegocio}
            autoComplete="organization"
            placeholder="Cobros del Valle"
            error={errors.nombre_negocio?.message}
            {...register("nombre_negocio")}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Select
            label={es.register.ciudad}
            options={MUNICIPIOS_COLOMBIA}
            placeholder="Selecciona tu ciudad"
            searchable
            error={errors.ciudad?.message}
            {...register("ciudad")}
          />

          <Input
            label={es.register.telefono}
            type="tel"
            autoComplete="tel"
            placeholder="+57 300 1234567"
            error={errors.telefono?.message}
            {...register("telefono")}
          />
        </div>

        <Input
          label={es.auth.email}
          type="email"
          autoComplete="email"
          placeholder="tu@correo.com"
          error={errors.email?.message}
          {...register("email")}
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <PasswordInput
            label={es.auth.password}
            autoComplete="new-password"
            placeholder="Minimo 8 caracteres"
            error={errors.password?.message}
            {...register("password")}
          />

          <PasswordInput
            label={es.auth.confirmPassword}
            autoComplete="new-password"
            placeholder="Repite tu contrasena"
            error={errors.confirmPassword?.message}
            {...register("confirmPassword")}
          />
        </div>

        {serverError && (
          <p className="rounded-lg bg-danger/10 p-3 text-sm text-danger" role="alert">
            {serverError}
          </p>
        )}

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <UserPlus className="h-4 w-4" />
          )}
          {es.register.comenzarGratis}
        </Button>
      </form>

      <Separator className="my-6" />

      <p className="text-center text-sm text-muted-foreground">
        {es.auth.hasAccount}{" "}
        <Link
          href="/login"
          className="font-medium text-primary hover:underline"
        >
          {es.auth.loginAction}
        </Link>
      </p>
    </>
  );
}
