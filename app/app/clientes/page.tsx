"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Plus, Phone, Users, MapPin, ArrowUpRight } from "lucide-react";
import { useClientes, type Cliente } from "@/hooks/queries/use-clientes";
import { useAuth } from "@/providers/auth-provider";
import { ScoreBadge } from "@/components/domain/score-badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { ClientForm } from "@/components/forms/client-form";
import { SkeletonList } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import {
  PageHeader,
  FilterPills,
  SearchInput,
  staggerDelay,
} from "@/components/ui/page-header";
import { cn } from "@/components/ui/cn";

type FilterPill = "todos" | "activos" | "inactivos";

const AVATAR_STYLES = [
  "bg-primary/15 text-primary",
  "bg-success/15 text-success",
  "bg-warning/15 text-warning",
  "bg-info/15 text-info",
];

export default function ClientesPage() {
  const { role } = useAuth();
  const canCreate = role === "admin" || role === "cobrador" || role === "super_admin";
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterPill>("todos");
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: clientes = [], isPending, error, refetch } = useClientes();

  const filtered = useMemo(() => {
    let list: Cliente[] = clientes;

    if (filter === "activos") list = list.filter((c) => c.activo);
    if (filter === "inactivos") list = list.filter((c) => !c.activo);

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.nombre.toLowerCase().includes(q) ||
          (c.cedula ?? "").toLowerCase().includes(q),
      );
    }

    return list;
  }, [clientes, search, filter]);

  const activos = clientes.filter((c) => c.activo).length;

  const pills = [
    { value: "todos" as const, label: "Todos", count: clientes.length },
    { value: "activos" as const, label: "Activos", count: activos },
    {
      value: "inactivos" as const,
      label: "Inactivos",
      count: clientes.length - activos,
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Directorio"
        title="Clientes"
        subtitle={
          isPending
            ? "Cargando cartera de clientes…"
            : `${clientes.length} cliente${clientes.length !== 1 ? "s" : ""} en tu cartera`
        }
        actions={
          canCreate && (
            <Button size="sm" onClick={() => setDialogOpen(true)} className="gap-1.5">
              <Plus className="h-4 w-4" strokeWidth={2.5} />
              <span className="hidden sm:inline">Crear cliente</span>
              <span className="sm:hidden">Crear</span>
            </Button>
          )
        }
      />

      <div
        className="dash-rise flex flex-col gap-3 sm:flex-row sm:items-center"
        style={{ animationDelay: "60ms" }}
      >
        <SearchInput
          placeholder="Buscar por nombre o cédula…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          containerClassName="flex-1"
        />
        <FilterPills options={pills} value={filter} onChange={setFilter} />
      </div>

      {isPending ? (
        <SkeletonList count={5} />
      ) : error ? (
        <ErrorState message={error.message} onRetry={() => refetch()} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title={
            search || filter !== "todos" ? "Sin resultados" : "Sin clientes aún"
          }
          description={
            search || filter !== "todos"
              ? "Intenta con otros filtros."
              : "Crea el primer cliente para empezar."
          }
          action={
            !search && filter === "todos" ? (
              <Button size="sm" onClick={() => setDialogOpen(true)} className="gap-1.5">
                <Plus className="h-4 w-4" />
                Crear cliente
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((cliente, i) => (
            <ClienteCard key={cliente.id} cliente={cliente} index={i} />
          ))}
        </div>
      )}

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="Crear cliente"
      >
        <ClientForm
          onSuccess={() => setDialogOpen(false)}
          onCancel={() => setDialogOpen(false)}
        />
      </Dialog>
    </div>
  );
}

function ClienteCard({ cliente, index }: { cliente: Cliente; index: number }) {
  const initials = cliente.nombre.slice(0, 2).toUpperCase();
  const avatar = AVATAR_STYLES[index % AVATAR_STYLES.length];

  return (
    <Link href={`/app/clientes/${cliente.id}`} className="block h-full">
      <div
        className="dash-rise group flex h-full items-center gap-3.5 rounded-xl border border-border bg-card px-4 py-3.5 backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-lg hover:shadow-primary/5"
        style={staggerDelay(index)}
      >
        <div className="relative shrink-0">
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold",
              avatar,
            )}
          >
            {initials}
          </div>
          <span
            className={cn(
              "absolute -bottom-px -right-px h-3 w-3 rounded-full border-2 border-card",
              cliente.activo ? "bg-success" : "bg-muted-foreground/50",
            )}
            title={cliente.activo ? "Activo" : "Inactivo"}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
              {cliente.nombre}
            </p>
            <ScoreBadge score={cliente.score_pago} />
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
            {cliente.cedula && (
              <span className="tabular-nums">CC {cliente.cedula}</span>
            )}
            <span className="flex items-center gap-1">
              <Phone className="h-3 w-3" />
              {cliente.telefono}
            </span>
            {cliente.barrio && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {cliente.barrio}
              </span>
            )}
          </div>
        </div>

        <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
      </div>
    </Link>
  );
}
