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
};

export function Dialog({ open, onClose, children, title, className }: DialogProps) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "relative z-50 w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl flex flex-col max-h-[90vh]",
          className,
        )}
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-4 shrink-0">
          {title && (
            <h2 className="text-lg font-semibold text-card-foreground">
              {title}
            </h2>
          )}
          <button
            type="button"
            onClick={onClose}
            className="ml-auto inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-6 pb-6 flex-1 min-h-0">
          {children}
        </div>
      </div>
    </div>
  );
}
