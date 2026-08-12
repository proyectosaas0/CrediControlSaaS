"use client";

import { type ReactNode, useEffect } from "react";
import { cn } from "@/components/ui/cn";
import { X } from "lucide-react";
import { useIsMounted } from "@/hooks/use-is-mounted";

type DialogProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  className?: string;
  /** Rendered below the scrollable content, pinned to the bottom (e.g. Cancelar/Guardar). */
  footer?: ReactNode;
};

export function Dialog({ open, onClose, children, title, className, footer }: DialogProps) {
  const mounted = useIsMounted();

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [open, onClose]);

  if (!mounted || !open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div
        className="dash-overlay-in absolute inset-0 bg-black/60 backdrop-blur-sm sm:bg-black/70"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "dash-sheet-up sm:dash-modal-in relative z-50 flex w-full flex-col border border-border bg-card shadow-2xl",
          "max-h-[92vh] rounded-t-3xl sm:max-h-[85vh] sm:max-w-lg sm:rounded-2xl",
          className,
        )}
      >
        <div className="mx-auto mt-2.5 h-1.5 w-10 shrink-0 rounded-full bg-border sm:hidden" />

        <div className="flex shrink-0 items-center justify-between gap-3 px-5 pb-4 pt-3 sm:px-6 sm:pt-6">
          {title && (
            <h2 className="font-display text-lg font-bold tracking-tight text-card-foreground">
              {title}
            </h2>
          )}
          <button
            type="button"
            onClick={onClose}
            className="ml-auto inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div
          className={cn(
            "min-h-0 flex-1 overflow-y-auto px-5 sm:px-6",
            footer ? "pb-4" : "pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:pb-6",
          )}
        >
          {children}
        </div>

        {footer && (
          <div className="shrink-0 border-t border-border px-5 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:px-6 sm:pb-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
