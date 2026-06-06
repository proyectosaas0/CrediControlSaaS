"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, Plus, Phone } from "lucide-react";
import { useClientes, type Cliente } from "@/hooks/queries/use-clientes";
import { ScoreBadge } from "@/components/domain/score-badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { ClientForm } from "@/components/forms/client-form";
import { cn } from "@/components/ui/cn";

type FilterPill = "todos" | "activos" | "inactivos";

export default function ClientesPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterPill>("todos");
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: clientes = [], isPending, error } = useClientes();

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

  const pills: { value: FilterPill; label: string }[] = [
    { value: "todos", label: "Todos" },
    { value: "activos", label: "Activos" },
    { value: "inactivos", label: "Inactivos" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Clientes</h1>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline ml-1">Crear</span>
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar por nombre o cedula..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex h-11 w-full rounded-lg border border-border bg-background pl-10 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {pills.map((pill) => (
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

      {isPending ? (
        <div className="py-12 text-center">
          <p className="text-muted-foreground">Cargando clientes...</p>
        </div>
      ) : error ? (
        <div className="py-12 text-center">
          <p className="text-danger">No se pudieron cargar los clientes: {error.message}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-muted-foreground">No se encontraron clientes</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((cliente) => (
            <Link key={cliente.id} href={`/app/clientes/${cliente.id}`}>
              <Card padding="md" className="flex items-center gap-3 transition-colors hover:border-primary/30 cursor-pointer h-full">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {cliente.nombre}
                    </p>
                    <ScoreBadge score={cliente.score_pago} />
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                    {cliente.cedula && <span>CC {cliente.cedula}</span>}
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {cliente.telefono}
                    </span>
                  </div>
                  {cliente.barrio && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {cliente.barrio}
                    </p>
                  )}
                </div>
                <div
                  className={cn(
                    "h-2.5 w-2.5 shrink-0 rounded-full",
                    cliente.activo ? "bg-success" : "bg-muted-foreground",
                  )}
                />
              </Card>
            </Link>
          ))}
        </div>
      )}

      <p className="text-center text-xs text-muted-foreground">
        {filtered.length} cliente{filtered.length !== 1 ? "s" : ""}
      </p>

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
