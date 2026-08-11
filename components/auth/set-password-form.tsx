"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import { setPasswordSchema, type SetPasswordInput } from "@/lib/schemas/auth";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { KeyRound, Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { es } from "@/lib/i18n/es";

type LinkStatus = "checking" | "valid" | "invalid";

export function SetPasswordForm() {
  const [linkStatus, setLinkStatus] = useState<LinkStatus>("checking");
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SetPasswordInput>({
    resolver: zodResolver(setPasswordSchema),
  });

  useEffect(() => {
    const supabase = createClient();

    // El link de invitacion/recuperacion establece la sesion de forma
    // asincrona al cargar (token en el hash de la URL) -- getSession()
    // solo, sin esperar, puede correr antes de que eso termine.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) setLinkStatus("valid");
      else if (event === "SIGNED_OUT") setLinkStatus("invalid");
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setLinkStatus("valid");
    });

    const timeout = setTimeout(() => {
      setLinkStatus((current) => (current === "checking" ? "invalid" : current));
    }, 2500);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  async function onSubmit(data: SetPasswordInput) {
    setServerError(null);
    const supabase = createClient();

    const { error } = await supabase.auth.updateUser({ password: data.password });
    if (error) {
      setServerError(error.message);
      return;
    }

    // Full-page navigation: consistente con login/logout, evita que el
    // middleware evalue la ruta antes de que la sesion quede asentada.
    window.location.assign("/app");
  }

  if (linkStatus === "checking") {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Verificando tu enlace...</p>
      </div>
    );
  }

  if (linkStatus === "invalid") {
    return (
      <div className="text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-danger/10 ring-1 ring-danger/20">
          <KeyRound className="h-6 w-6 text-danger" />
        </div>
        <h1 className="font-display text-xl font-bold tracking-tight text-foreground">
          Enlace invalido o vencido
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Pedile a tu administrador que te reenvie la invitacion.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block text-sm font-medium text-primary hover:underline"
        >
          Volver a iniciar sesion
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 text-center">
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          Crea tu contrasena
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Elegi una contrasena para entrar a tu cuenta de CrediControl
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
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

        {serverError && (
          <p className="rounded-lg bg-danger/10 p-3 text-sm text-danger" role="alert">
            {serverError}
          </p>
        )}

        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <KeyRound className="h-4 w-4" />
          )}
          Crear contrasena y entrar
        </Button>
      </form>
    </>
  );
}
