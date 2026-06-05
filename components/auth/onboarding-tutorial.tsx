"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Banknote, HandCoins, ArrowRight, Check } from "lucide-react";
import { useRouter } from "next/navigation";

const STEPS = [
  {
    step: 1,
    icon: UserPlus,
    title: "Crea tu primer cliente",
    description:
      "Registra a tu primer deudor con nombre, cedula y telefono. Lo necesitaras para crear un prestamo.",
    route: "/app/clientes",
    cta: "Ir a Clientes",
  },
  {
    step: 2,
    icon: HandCoins,
    title: "Crea un cobrador",
    description:
      "Agrega a la persona que hara los cobros diarios. Puede ser tu o alguien de tu equipo.",
    route: "/app/cobradores",
    cta: "Ir a Cobradores",
  },
  {
    step: 3,
    icon: Banknote,
    title: "Crea tu primer prestamo",
    description:
      "Selecciona un cliente, define capital, tasa y plazo. El cronograma se genera automaticamente.",
    route: "/app/prestamos/nuevo",
    cta: "Crear Prestamo",
  },
];

type OnboardingTutorialProps = {
  onComplete: () => void;
};

export function OnboardingTutorial({ onComplete }: OnboardingTutorialProps) {
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const router = useRouter();

  function toggleStep(step: number) {
    setCompletedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(step)) {
        next.delete(step);
      } else {
        next.add(step);
      }
      return next;
    });
  }

  const allDone = completedSteps.size === STEPS.length;

  return (
    <Card className="border-primary/20">
      <CardHeader className="text-center">
        <Badge variant="primary" className="mx-auto w-fit">
          Onboarding
        </Badge>
        <CardTitle className="mt-2">Bienvenido a CrediControl</CardTitle>
        <CardDescription>
          Completa estos 3 pasos para empezar a cobrar. Toma menos de 5
          minutos.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        {STEPS.map((s) => {
          const done = completedSteps.has(s.step);
          return (
            <div
              key={s.step}
              className={[
                "flex items-start gap-3 rounded-lg border p-3 transition-colors",
                done
                  ? "border-success/30 bg-success/5"
                  : "border-border bg-background",
              ].join(" ")}
            >
              <div
                className={[
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                  done
                    ? "bg-success/10"
                    : "bg-muted",
                ].join(" ")}
              >
                {done ? (
                  <Check className="h-5 w-5 text-success" />
                ) : (
                  <s.icon className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-foreground">
                  {s.step}. {s.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {s.description}
                </p>
                {!done && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 h-auto p-0 text-primary hover:text-primary-hover"
                    onClick={() => {
                      toggleStep(s.step);
                      router.push(s.route);
                    }}
                  >
                    {s.cta}
                    <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>

      <Separator />

      <CardFooter className="flex-col gap-2">
        <Button
          size="lg"
          className="w-full"
          disabled={!allDone}
          onClick={onComplete}
        >
          {allDone ? (
            <>
              <Check className="h-4 w-4" />
              Empezar a usar CrediControl
            </>
          ) : (
            `Completa los 3 pasos (${completedSteps.size}/3)`
          )}
        </Button>
        <button
          type="button"
          onClick={onComplete}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Saltar tutorial
        </button>
      </CardFooter>
    </Card>
  );
}
