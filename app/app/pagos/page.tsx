"use client";

import { useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { usePagos } from "@/hooks/queries/use-pagos";
import { Card } from "@/components/ui/card";
import { formatCop } from "@/lib/domain/money";

export default function PagosPage() {
  const [search, setSearch] = useState("");
  const { data: pagos = [], isPending, error } = usePagos();

  const filtered = pagos.filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (p.clientes?.nombre ?? "").toLowerCase().includes(q) ||
      p.id.toLowerCase().includes(q)
    );
  });

  const totalMonto = filtered.reduce((sum, p) => sum + p.monto, 0);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-foreground">Pagos</h1>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar por cliente o ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex h-11 w-full rounded-lg border border-border bg-background pl-10 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
        />
      </div>

      <p className="text-xs text-muted-foreground">
        {filtered.length} pago{filtered.length !== 1 ? "s" : ""} · Total: {formatCop(totalMonto)}
      </p>

      {isPending ? (
        <div className="py-12 text-center">
          <p className="text-muted-foreground">Cargando pagos...</p>
        </div>
      ) : error ? (
        <div className="py-12 text-center">
          <p className="text-danger">No se pudieron cargar los pagos: {error.message}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-muted-foreground">No se encontraron pagos</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((pago) => (
            <Link key={pago.id} href={`/app/pagos/${pago.id}`}>
              <Card padding="md" className="transition-colors hover:border-primary/30 cursor-pointer h-full">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground">
                    {pago.clientes?.nombre ?? "—"}
                  </p>
                  <p className="text-sm font-semibold text-foreground">
                    {formatCop(pago.monto)}
                  </p>
                </div>
                <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                  <span>Fecha: {new Date(pago.created_at).toLocaleDateString()}</span>
                  <span>Método: {pago.medio_pago}</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
