import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { BarChart3, MessageSquare, NotebookPen, ArrowRight } from "lucide-react";

const BENEFITS = [
  {
    icon: BarChart3,
    title: "Control en tiempo real",
    description: "Ve el recaudo del dia, mora y cartera desde tu celular.",
  },
  {
    icon: MessageSquare,
    title: "Comprobantes WhatsApp",
    description: "Envia recibos de pago automaticos a tus clientes.",
  },
  {
    icon: NotebookPen,
    title: "Cero cuadernillos",
    description: "Digitaliza tu cobranza diaria. Sin papel, sin perdidas.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center gap-8 py-8 text-center md:gap-10">
      <div className="space-y-3">
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
          Digitaliza tu
          <br />
          <span className="bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
            cobranza diaria
          </span>
        </h1>
        <p className="mx-auto max-w-sm text-muted-foreground">
          Controla tu cartera, registra pagos y envia comprobantes desde
          tu celular. Sin cuadernos, sin excusas.
        </p>
      </div>

      <div className="flex w-full flex-col gap-3 sm:flex-row">
        <Link
          href="/register"
          className={buttonClasses("primary", "lg") + " w-full"}
        >
          Comenzar gratis
          <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          href="/login"
          className={buttonClasses("outline", "lg") + " w-full"}
        >
          Ya tengo cuenta
        </Link>
      </div>

      <Separator />

      <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
        {BENEFITS.map((b) => (
          <Card key={b.title} padding="sm">
            <CardContent className="flex items-start gap-3 p-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <b.icon className="h-5 w-5 text-primary" />
              </div>
              <div className="text-left">
                <p className="font-medium text-foreground">{b.title}</p>
                <p className="text-sm text-muted-foreground">
                  {b.description}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Separator />

      <div className="w-full rounded-xl border border-border bg-muted p-4 text-left md:p-6">
        <p className="text-sm italic text-muted-foreground">
          &ldquo;Antes perdia 2 horas todas las noches contando. Ahora cierro
          ruta en 5 minutos y mis clientes reciben el comprobante al
          instante.&rdquo;
        </p>
        <p className="mt-2 text-sm font-medium text-foreground">
          — Dairo, prestamista piloto
        </p>
      </div>

      <div className="w-full space-y-2 rounded-xl border border-primary/20 bg-primary/5 p-4 text-center md:p-6">
        <p className="text-lg font-semibold text-foreground">
          Plan gratuito — 15 dias
        </p>
        <p className="text-sm text-muted-foreground">
          Clientes ilimitados, prestamos y cobradores. Sin tarjeta de
          credito.
        </p>
        <Link
          href="/register"
          className={buttonClasses("primary", "sm") + " mt-2 inline-flex"}
        >
          Probar gratis
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <p className="text-xs text-muted-foreground">
        CrediControl por SocioIA &middot; Cobranza diaria digital
      </p>
    </div>
  );
}
