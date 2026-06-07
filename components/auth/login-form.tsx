"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import { loginSchema, type LoginInput } from "@/lib/schemas/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Separator } from "@/components/ui/separator";
import { LogIn, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { es } from "@/lib/i18n/es";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? "/app";
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginInput) {
    setServerError(null);
    const supabase = createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      if (error.message.includes("Invalid login credentials")) {
        setServerError("Correo o contrasena incorrectos");
      } else if (error.message.includes("Email not confirmed")) {
        setServerError("Debes verificar tu correo antes de iniciar sesion");
      } else {
        setServerError(error.message);
      }
      return;
    }

    router.push(redirectTo);
    router.refresh();
  }

  return (
    <>
      <div className="mb-6 text-center">
        <h1 className="text-xl font-bold text-foreground">{es.auth.login}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ingresa a tu cuenta de CrediControl
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input
          label={es.auth.email}
          type="email"
          autoComplete="email"
          placeholder="tu@correo.com"
          error={errors.email?.message}
          {...register("email")}
        />

        <PasswordInput
          label={es.auth.password}
          autoComplete="current-password"
          placeholder="********"
          error={errors.password?.message}
          {...register("password")}
        />

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
            <LogIn className="h-4 w-4" />
          )}
          {es.auth.loginAction}
        </Button>
      </form>

      <Separator className="my-6" />

      <p className="text-center text-sm text-muted-foreground">
        {es.auth.noAccount}{" "}
        <Link
          href="/register"
          className="font-medium text-primary hover:underline"
        >
          {es.auth.createAccount}
        </Link>
      </p>
    </>
  );
}
