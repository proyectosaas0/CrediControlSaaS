"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Building2, ChevronDown, Check, AlertCircle } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { useTenants } from "@/hooks/queries/use-super-admin";

const STATUS: Record<string, { dot: string; label: string }> = {
  activo:     { dot: "bg-emerald-400", label: "Activo" },
  trial:      { dot: "bg-amber-400",   label: "Trial" },
  suspendido: { dot: "bg-red-400",     label: "Suspendido" },
};

export function OrgSwitcher() {
  const { effectiveOrgId, setActiveOrgId } = useAuth();
  const { data: tenants = [], isLoading } = useTenants();
  const [open, setOpen] = useState(false);
  const [dropPos, setDropPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);

  const activeOrg = tenants.find((t) => t.id === effectiveOrgId);
  const hasOrg = !!activeOrg;

  const openDropdown = useCallback(() => {
    if (!triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    setDropPos({ top: r.bottom + 6, left: r.left });
    setOpen(true);
  }, []);

  // Reposition on scroll/resize
  useEffect(() => {
    if (!open) return;
    const update = () => {
      if (!triggerRef.current) return;
      const r = triggerRef.current.getBoundingClientRect();
      setDropPos({ top: r.bottom + 6, left: r.left });
    };
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        onClick={open ? () => setOpen(false) : openDropdown}
        aria-expanded={open}
        aria-label="Seleccionar organización"
        className={[
          "group flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all duration-150",
          hasOrg
            ? "bg-white/[0.06] text-foreground hover:bg-white/[0.10]"
            : "bg-amber-500/10 text-amber-400 hover:bg-amber-500/15 ring-1 ring-inset ring-amber-500/25",
        ].join(" ")}
      >
        {hasOrg ? (
          <Building2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        ) : (
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
        )}

        <span className="max-w-[160px] truncate leading-none">
          {activeOrg?.nombre_negocio ?? "Seleccionar org"}
        </span>

        {hasOrg && (
          <span
            className={`h-1.5 w-1.5 rounded-full shrink-0 ${STATUS[activeOrg.estado_suscripcion]?.dot ?? "bg-muted-foreground/40"}`}
          />
        )}

        <ChevronDown
          className={`h-3 w-3 shrink-0 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open &&
        createPortal(
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-[9998]"
              onClick={() => setOpen(false)}
            />

            {/* Dropdown */}
            <div
              style={{ top: dropPos.top, left: dropPos.left }}
              className="fixed z-[9999] w-64 overflow-hidden rounded-xl border border-white/[0.08] bg-[#141414] shadow-[0_16px_48px_rgba(0,0,0,0.6)] ring-1 ring-black/40"
            >
              {/* Header */}
              <div className="flex items-center gap-2 border-b border-white/[0.06] px-3 py-2.5">
                <Building2 className="h-3 w-3 text-muted-foreground" />
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Organizaciones
                </p>
              </div>

              {/* List */}
              <div className="max-h-[280px] overflow-y-auto">
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2 py-6">
                    <div className="h-1 w-1 rounded-full bg-muted-foreground animate-bounce [animation-delay:0ms]" />
                    <div className="h-1 w-1 rounded-full bg-muted-foreground animate-bounce [animation-delay:120ms]" />
                    <div className="h-1 w-1 rounded-full bg-muted-foreground animate-bounce [animation-delay:240ms]" />
                  </div>
                ) : tenants.length === 0 ? (
                  <p className="py-6 text-center text-xs text-muted-foreground">
                    Sin organizaciones
                  </p>
                ) : (
                  tenants.map((tenant) => {
                    const isActive = tenant.id === effectiveOrgId;
                    const status = STATUS[tenant.estado_suscripcion];
                    return (
                      <button
                        key={tenant.id}
                        onClick={() => {
                          setActiveOrgId(tenant.id);
                          setOpen(false);
                        }}
                        className={[
                          "flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors duration-100",
                          isActive
                            ? "bg-white/[0.07]"
                            : "hover:bg-white/[0.04]",
                        ].join(" ")}
                      >
                        <span
                          className={`mt-0.5 h-1.5 w-1.5 rounded-full shrink-0 ${status?.dot ?? "bg-muted-foreground/40"}`}
                        />
                        <span className="flex-1 min-w-0">
                          <span
                            className={`block truncate text-sm leading-snug ${isActive ? "font-semibold text-foreground" : "font-normal text-foreground/80"}`}
                          >
                            {tenant.nombre_negocio}
                          </span>
                          {tenant.ciudad && (
                            <span className="block truncate text-[11px] leading-snug text-muted-foreground/60 mt-0.5">
                              {tenant.ciudad}
                            </span>
                          )}
                        </span>
                        {isActive && (
                          <Check className="h-3 w-3 shrink-0 text-primary" />
                        )}
                      </button>
                    );
                  })
                )}
              </div>

              {/* Legend */}
              <div className="flex items-center gap-3 border-t border-white/[0.06] px-3 py-2">
                {Object.entries(STATUS).map(([key, { dot, label }]) => (
                  <span key={key} className="flex items-center gap-1.5">
                    <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
                    <span className="text-[10px] text-muted-foreground/60">{label}</span>
                  </span>
                ))}
              </div>
            </div>
          </>,
          document.body,
        )}
    </>
  );
}
