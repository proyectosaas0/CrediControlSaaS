"use client";

import { useState } from "react";
import { useAuth } from "@/providers/auth-provider";
import { OnboardingTutorial } from "@/components/auth/onboarding-tutorial";

export default function DashboardPage() {
  const { user, role } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(true);

  if (showOnboarding) {
    return (
      <div className="mx-auto max-w-md py-4">
        <OnboardingTutorial onComplete={() => setShowOnboarding(false)} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          Hola, {user?.email?.split("@")[0] ?? "Usuario"}
        </h1>
        <p className="text-muted-foreground">
          {role === "cobrador"
            ? "Tu ruta del dia te espera."
            : "Resumen de tu cartera."}
        </p>
      </div>
      <p className="text-muted-foreground">
        Dashboard completo — Fase 2
      </p>
    </div>
  );
}
