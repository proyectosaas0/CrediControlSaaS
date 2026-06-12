"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Plus, FileText } from "lucide-react";
import { usePrestamos, type Prestamo } from "@/hooks/queries/use-prestamos";
import { LoanStatusBadge } from "@/components/domain/loan-status-badge";
import { Button } from "@/components/ui/button";
import { SkeletonList } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import {
  PageHeader,
  FilterPills,
  SearchInput,
  staggerDelay,
} from "@/components/ui/page-header";
import { formatCop } from "@/lib/domain/money";

type EstadoFilter =
  | "todos"
  | "activo"
  | "en_mora"
  | "saldado"
  | "refinanciado"
  | "cancelado";

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
    <div className="space-y-5">
      <PageHeader
        eyebrow="Cartera"
        title="Préstamos"
        subtitle={
          isPending ? (
            "Cargando préstamos…"
          ) : (
            <>
              {filtered.length} préstamo{filtered.length !== 1 ? "s" : ""} ·
              capital{" "}
              <span className="font-semibold text-foreground tabular-nums">
                {formatCop(totalCapital)}
              </span>
            </>
          )
        }
        actions={
          <Link href="/app/prestamos/nuevo">
            <Button size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" strokeWidth={2.5} />
              <span className="hidden sm:inline">Nuevo préstamo</span>
              <span className="sm:hidden">Nuevo</span>
            </Button>
          </Link>
        }
      />

      <div
        className="dash-rise flex flex-col gap-3 sm:flex-row sm:items-center"
        style={{ animationDelay: "60ms" }}
      >
        <SearchInput
          placeholder="Buscar por cliente…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          containerClassName="flex-1"
        />
        <FilterPills options={FILTER_PILLS} value={filter} onChange={setFilter} />
      </div>

      {isPending ? (
        <SkeletonList count={4} />
      ) : error ? (
        <ErrorState message={error.message} onRetry={() => refetch()} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={
            search || filter !== "todos" ? "Sin resultados" : "Sin préstamos aún"
          }
          description={
            search || filter !== "todos"
              ? "Intenta con otros filtros."
              : "Crea el primer préstamo para empezar."
          }
          action={
            !search && filter === "todos" ? (
              <Link href="/app/prestamos/nuevo">
                <Button size="sm" className="gap-1.5">
                  <Plus className="h-4 w-4" />
                  Nuevo préstamo
                </Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((prestamo, i) => (
            <PrestamoCard key={prestamo.id} prestamo={prestamo} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

function PrestamoCard({ prestamo, index }: { prestamo: Prestamo; index: number }) {
  const saldo = prestamo.prestamo_saldos?.[0];
  const pagadas = saldo?.cuotas_pagadas ?? 0;
  const totales = saldo?.cuotas_totales ?? 0;
  const pct = totales > 0 ? Math.round((pagadas / totales) * 100) : 0;

  return (
    <Link href={`/app/prestamos/${prestamo.id}`} className="block h-full">
      <div
        className="dash-rise group flex h-full flex-col rounded-xl border border-border bg-card p-4 backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-lg hover:shadow-primary/5"
        style={staggerDelay(index)}
      >
        <div className="flex items-start justify-between gap-2">
          <p className="truncate text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
            {prestamo.clientes?.nombre ?? "—"}
          </p>
          <LoanStatusBadge estado={prestamo.estado} />
        </div>

        <p className="mt-2.5 font-display text-xl font-bold leading-none tracking-tight text-foreground tabular-nums">
          {formatCop(prestamo.capital)}
        </p>

        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <span className="tabular-nums">
            {formatCop(prestamo.cuota_diaria ?? 0)}/día
          </span>
          <span className="tabular-nums">
            Cuota {pagadas}/{totales}
          </span>
        </div>

        <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-violet-400 transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>

        <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground/70">
          <span className="tabular-nums">
            Total {formatCop(prestamo.total_pagar ?? 0)}
          </span>
          <span className="font-semibold tabular-nums text-muted-foreground">
            {pct}%
          </span>
        </div>
      </div>
    </Link>
  );
}
