import { AlertCircle, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type ErrorStateProps = {
  message?: string;
  onRetry?: () => void;
};

export function ErrorState({ message = "Algo salio mal", onRetry }: ErrorStateProps) {
  return (
    <Card padding="md" className="flex flex-col items-center justify-center py-10 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-danger/10 mb-4">
        <AlertCircle className="h-7 w-7 text-danger" />
      </div>
      <p className="text-sm font-semibold text-foreground">Error al cargar</p>
      <p className="mt-1 text-xs text-muted-foreground max-w-xs">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="mt-4 gap-2">
          <RefreshCw className="h-3.5 w-3.5" />
          Reintentar
        </Button>
      )}
    </Card>
  );
}
