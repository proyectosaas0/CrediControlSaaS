"use client";

import { useAuth } from "@/providers/auth-provider";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, LogOut } from "lucide-react";
import { MOCK_COBRADOR } from "@/lib/mock/ruta";
import { es } from "@/lib/i18n/es";

export default function PerfilPage() {
  const { user, role, signOut } = useAuth();

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-foreground">Perfil</h1>

      <Card padding="md">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <User className="h-7 w-7 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-semibold text-foreground">
              {MOCK_COBRADOR}
            </p>
            <p className="truncate text-sm text-muted-foreground">
              {user?.email ?? "cobrador@correo.com"}
            </p>
            <Badge variant="primary" className="mt-1">
              {role ?? "cobrador"}
            </Badge>
          </div>
        </div>
      </Card>

      <Button
        variant="outline"
        size="lg"
        className="w-full"
        onClick={signOut}
      >
        <LogOut className="h-4 w-4" />
        {es.auth.logout}
      </Button>
    </div>
  );
}
