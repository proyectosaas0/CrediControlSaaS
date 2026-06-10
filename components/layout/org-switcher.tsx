"use client";

import { useState } from "react";
import { Building2, ChevronDown, Check } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { useTenants } from "@/hooks/queries/use-super-admin";

export function OrgSwitcher() {
  const { effectiveOrgId, setActiveOrgId } = useAuth();
  const { data: tenants = [] } = useTenants();
  const [open, setOpen] = useState(false);

  const activeOrg = tenants.find((t) => t.id === effectiveOrgId);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        aria-expanded={open}
        aria-label="Seleccionar organización"
      >
        <Building2 className="h-3.5 w-3.5 shrink-0" />
        <span className="max-w-[140px] truncate">
          {activeOrg?.nombre_negocio ?? "Seleccionar org"}
        </span>
        <ChevronDown className={`h-3 w-3 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-10 z-50 w-56 rounded-xl border border-border bg-card py-1 shadow-lg">
            <p className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Organizaciones
            </p>
            {tenants.map((tenant) => (
              <button
                key={tenant.id}
                onClick={() => {
                  setActiveOrgId(tenant.id);
                  setOpen(false);
                }}
                className="flex w-full items-center justify-between gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
              >
                <span className="truncate">{tenant.nombre_negocio}</span>
                {tenant.id === effectiveOrgId && (
                  <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
