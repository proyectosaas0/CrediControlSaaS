"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Plus, FileText, Loader2, Calendar } from "lucide-react";
import { usePrestamosInfinite, type Prestamo } from "@/hooks/queries/use-prestamos";
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
import { diaCobroLabel } from "@/lib/schemas/admin";

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

  const {
    data,
    isPending,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = usePrestamosInfinite();
  const prestamos = useMemo(() => data?.pages.flatMap((p) => p.data) ?? [], [data]);
  const totalCount = data?.pages[0]?.meta.count ?? prestamos.length;
  const totalCapitalAll = data?.pages[0]?.meta.totalCapital ?? 0;

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

  const isUnfiltered = filter === "todos" && !search;
  const totalCapital = isUnfiltered ? totalCapitalAll : filtered.reduce((sum, p) => sum + p.capital, 0);
  const displayCount = isUnfiltered ? totalCount : filtered.length;

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
              {displayCount} préstamo{displayCount !== 1 ? "s" : ""} ·
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
        <>
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((prestamo, i) => (
              <PrestamoCard key={prestamo.id} prestamo={prestamo} index={i} />
            ))}
          </div>
          {hasNextPage && (
            <div className="flex flex-col items-center gap-1.5 pt-2">
              {(search || filter !== "todos") && (
                <p className="text-xs text-muted-foreground">
                  ¿No encontrás lo que buscás? Cargá más para ampliar la búsqueda.
                </p>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="gap-1.5"
              >
                {isFetchingNextPage && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Cargar más préstamos
              </Button>
            </div>
          )}
        </>
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

        {prestamo.dia_cobro && prestamo.dia_cobro.length > 0 && (
          <span className="mt-1.5 inline-flex w-fit items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
            <Calendar className="h-3 w-3" />
            {prestamo.dia_cobro.map(diaCobroLabel).join(", ")}
          </span>
        )}

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
