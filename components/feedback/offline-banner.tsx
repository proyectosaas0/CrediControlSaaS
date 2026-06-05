"use client";

import { WifiOff } from "lucide-react";

export function OfflineBanner() {
  return (
    <div className="fixed inset-x-0 top-0 z-[60] flex items-center justify-center gap-2 bg-warning px-4 py-2 text-sm font-medium text-warning-foreground">
      <WifiOff className="h-4 w-4" />
      Sin conexion — tus cambios se enviaran al recuperar red
    </div>
  );
}
