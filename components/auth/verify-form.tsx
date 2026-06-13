"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { MailCheck, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { es } from "@/lib/i18n/es";

export function VerifyForm() {
  const router = useRouter();
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleResend() {
    setResending(true);
    setError(null);
    setResent(false);

    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user?.email) {
      setError("No se encontro una sesion activa. Registra tu cuenta primero.");
      setResending(false);
      return;
    }

    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email: session.user.email,
    });

    if (resendError) {
      setError(resendError.message);
    } else {
      setResent(true);
    }
    setResending(false);
  }

  async function handleCheckVerification() {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.refreshSession();

    if (session?.user?.email_confirmed_at) {
      router.push("/app");
      router.refresh();
    } else {
      setError("Tu correo aun no ha sido verificado. Revisa tu bandeja de entrada.");
    }
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
          <MailCheck className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="font-display text-xl font-bold tracking-tight">
          {es.auth.verify}
        </CardTitle>
        <CardDescription>
          {es.auth.verifyInstruction}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          onClick={handleCheckVerification}
        >
          Ya verifique mi correo
        </Button>

        {error && (
          <p className="rounded-lg bg-danger/10 p-3 text-sm text-danger" role="alert">
            {error}
          </p>
        )}

        {resent && (
          <p className="rounded-lg bg-success/10 p-3 text-sm text-success" role="alert">
            Correo reenviado. Revisa tu bandeja de entrada.
          </p>
        )}

        <Separator />

        <Button
          variant="outline"
          className="w-full"
          onClick={handleResend}
          disabled={resending}
        >
          {resending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : null}
          Reenviar correo de verificacion
        </Button>
      </CardContent>

      <Separator />

      <CardFooter className="justify-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" />
          Volver a iniciar sesion
        </Link>
      </CardFooter>
    </Card>
  );
}
