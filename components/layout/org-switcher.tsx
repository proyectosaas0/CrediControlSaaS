"use client";

import { useState } from "react";
import { Building2, ChevronDown, Check, AlertCircle } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { useTenants } from "@/hooks/queries/use-super-admin";

const STATUS_DOT: Record<string, string> = {
  activo: "bg-emerald-500",
  trial: "bg-amber-400",
  suspendido: "bg-red-500",
};

export function OrgSwitcher() {
  const { effectiveOrgId, setActiveOrgId } = useAuth();
  const { data: tenants = [], isLoading } = useTenants();
  const [open, setOpen] = useState(false);

  const activeOrg = tenants.find((t) => t.id === effectiveOrgId);
  const hasOrg = !!activeOrg;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={[
          "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
          hasOrg
            ? "bg-muted/60 text-foreground hover:bg-muted"
            : "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 ring-1 ring-amber-500/30",
        ].join(" ")}
        aria-expanded={open}
        aria-label="Seleccionar organización"
      >
        {hasOrg ? (
          <Building2 className="h-3.5 w-3.5 shrink-0" />
        ) : (
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
        )}
        <span className="max-w-[150px] truncate">
          {activeOrg?.nombre_negocio ?? "Seleccionar org"}
        </span>
        {hasOrg && (
          <span
            className={`h-1.5 w-1.5 rounded-full shrink-0 ${STATUS_DOT[activeOrg.estado_suscripcion] ?? "bg-muted-foreground"}`}
          />
        )}
        <ChevronDown
          className={`h-3 w-3 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-10 z-50 w-64 rounded-xl border border-border bg-card shadow-xl overflow-hidden">
            <div className="px-3 py-2 border-b border-border">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                Organizaciones
              </p>
            </div>

            <div className="max-h-64 overflow-y-auto py-1">
              {isLoading ? (
                <p className="px-3 py-3 text-xs text-muted-foreground text-center">
                  Cargando...
                </p>
              ) : tenants.length === 0 ? (
                <p className="px-3 py-3 text-xs text-muted-foreground text-center">
                  Sin organizaciones
                </p>
              ) : (
                tenants.map((tenant) => {
                  const isActive = tenant.id === effectiveOrgId;
                  return (
                    <button
                      key={tenant.id}
                      onClick={() => {
                        setActiveOrgId(tenant.id);
                        setOpen(false);
                      }}
                      className={[
                        "flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors",
                        isActive
                          ? "bg-primary/10 text-foreground"
                          : "text-foreground hover:bg-muted",
                      ].join(" ")}
                    >
                      <span
                        className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${STATUS_DOT[tenant.estado_suscripcion] ?? "bg-muted-foreground"}`}
                      />
                      <span className="flex-1 min-w-0">
                        <span className="block truncate text-sm font-medium">
                          {tenant.nombre_negocio}
                        </span>
                        {tenant.ciudad && (
                          <span className="block truncate text-[11px] text-muted-foreground">
                            {tenant.ciudad}
                          </span>
                        )}
                      </span>
                      {isActive && (
                        <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
                      )}
                    </button>
                  );
                })
              )}
            </div>

            <div className="border-t border-border px-3 py-1.5">
              <p className="text-[10px] text-muted-foreground">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1 align-middle" />activo
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400 mx-1 ml-2 align-middle" />trial
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-500 mx-1 ml-2 align-middle" />suspendido
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
