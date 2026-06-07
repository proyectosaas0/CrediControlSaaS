"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Plus, Search, FileText } from "lucide-react";
import { usePrestamos, type Prestamo } from "@/hooks/queries/use-prestamos";
import { LoanStatusBadge } from "@/components/domain/loan-status-badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SkeletonList } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { cn } from "@/components/ui/cn";
import { formatCop } from "@/lib/domain/money";

type EstadoFilter = "todos" | "activo" | "en_mora" | "saldado" | "refinanciado" | "cancelado";

const FILTER_PILLS: { value: EstadoFilter; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "activo", label: "Activos" },
  { value: "en_mora", label: "En mora" },
  { value: "saldado", label: "Saldados" },
  { value: "refinanciado", label: "Refinanciados" },
  { value: "cancelado", label: "Cancelados" },
];

export default function PrestamosPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<EstadoFilter>("todos");

  const { data: prestamos = [], isPending, error, refetch } = usePrestamos();

  const filtered = useMemo(() => {
    let list: Prestamo[] = prestamos;

    if (filter !== "todos") list = list.filter((p) => p.estado === filter);

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          (p.clientes?.nombre ?? "").toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q),
      );
    }

    return list;
  }, [prestamos, search, filter]);

  const totalCapital = filtered.reduce((sum, p) => sum + p.capital, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Prestamos</h1>
        <Link href="/app/prestamos/nuevo">
          <Button size="sm">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline ml-1">Nuevo</span>
          </Button>
        </Link>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar por cliente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex h-11 w-full rounded-lg border border-border bg-background pl-10 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {FILTER_PILLS.map((pill) => (
          <button
            key={pill.value}
            onClick={() => setFilter(pill.value)}
            className={cn(
              "whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              filter === pill.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80",
            )}
          >
            {pill.label}
          </button>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        {filtered.length} prestamo{filtered.length !== 1 ? "s" : ""} · Capital total: {formatCop(totalCapital)}
      </p>

      {isPending ? (
        <SkeletonList count={4} />
      ) : error ? (
        <ErrorState message={error.message} onRetry={() => refetch()} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={search || filter !== "todos" ? "Sin resultados" : "Sin prestamos aun"}
          description={search || filter !== "todos" ? "Intenta con otros filtros." : "Crea el primer prestamo para empezar."}
          action={!search && filter === "todos" ? (
            <Link href="/app/prestamos/nuevo"><Button size="sm"><Plus className="h-4 w-4" />Nuevo prestamo</Button></Link>
          ) : undefined}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((prestamo) => (
            <Link key={prestamo.id} href={`/app/prestamos/${prestamo.id}`}>
              <Card padding="md" className="transition-colors hover:border-primary/30 cursor-pointer h-full">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground">
                    {prestamo.clientes?.nombre ?? "—"}
                  </p>
                  <LoanStatusBadge estado={prestamo.estado} />
                </div>
                <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span>Capital: {formatCop(prestamo.capital)}</span>
                  <span>Cuota: {formatCop(prestamo.cuota_diaria ?? 0)}/dia</span>
                  <span>Total: {formatCop(prestamo.total_pagar ?? 0)}</span>
                  <span>Cuota {prestamo.prestamo_saldos[0]?.cuotas_pagadas ?? 0}/{prestamo.prestamo_saldos[0]?.cuotas_totales ?? 0}</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
