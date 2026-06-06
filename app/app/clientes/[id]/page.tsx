"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Phone, MapPin, FileText } from "lucide-react";
import { useCliente, usePrestamos } from "@/lib/hooks";
import { ScoreBadge } from "@/components/domain/score-badge";
import { LoanStatusBadge } from "@/components/domain/loan-status-badge";
import { Card } from "@/components/ui/card";
import { formatCop } from "@/lib/domain/money";

export default function ClienteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: cliente, isPending, error } = useCliente(id);
  const { data: prestamos = [] } = usePrestamos();

  if (isPending) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  if (error || !cliente) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">Cliente no encontrado</p>
        <button
          onClick={() => router.back()}
          className="mt-4 text-sm text-primary underline"
        >
          Volver
        </button>
      </div>
    );
  }

  const prestamosCliente = prestamos.filter((p) => p.clienteId === cliente.id);
  const totalPrestado = prestamosCliente.reduce((sum, p) => sum + p.capital, 0);
  const prestamosActivos = prestamosCliente.filter((p) => p.estado === "activo" || p.estado === "en_mora");

  return (
    <div className="space-y-5">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver
      </button>

      <Card padding="md">
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-bold text-foreground">
                {cliente.nombre}
              </h1>
              {cliente.cedula && (
                <p className="text-sm text-muted-foreground">
                  CC {cliente.cedula}
                </p>
              )}
            </div>
            <ScoreBadge score={cliente.scorePago} size="lg" />
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-4 w-4" />
              <span>{cliente.telefono}</span>
            </div>
            {cliente.direccion && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>
                  {cliente.direccion}
                  {cliente.barrio ? ` · ${cliente.barrio}` : ""}
                </span>
              </div>
            )}
            {cliente.notas && (
              <div className="flex items-start gap-2 text-muted-foreground">
                <FileText className="h-4 w-4 mt-0.5" />
                <span>{cliente.notas}</span>
              </div>
            )}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card padding="md">
          <p className="text-xs text-muted-foreground">Total prestado</p>
          <p className="text-lg font-bold font-mono text-foreground">
            {formatCop(totalPrestado)}
          </p>
        </Card>
        <Card padding="md">
          <p className="text-xs text-muted-foreground">Prestamos activos</p>
          <p className="text-lg font-bold text-foreground">
            {prestamosActivos.length}
          </p>
        </Card>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-foreground mb-3">
          Historial de prestamos
        </h2>
        {prestamosCliente.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Sin prestamos registrados
          </p>
        ) : (
          <div className="space-y-3">
            {prestamosCliente.map((prestamo) => (
              <Link key={prestamo.id} href={`/app/prestamos/${prestamo.id}`}>
                <Card padding="md" className="mb-3 transition-colors hover:border-primary/30 cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {formatCop(prestamo.capital)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {prestamo.modeloInteres.replace("_", " ")} · {prestamo.tasaMensual}% mensual
                      </p>
                    </div>
                    <LoanStatusBadge estado={prestamo.estado} />
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Cuota {prestamo.cuotasPagadas}/{prestamo.cuotasTotales}</span>
                    <span>·</span>
                    <span>{formatCop(prestamo.saldoPendiente)} pendiente</span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
