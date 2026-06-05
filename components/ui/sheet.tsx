"use client";

import { type ReactNode, useEffect } from "react";
import { cn } from "@/components/ui/cn";
import { X } from "lucide-react";
import { useIsMounted } from "@/hooks/use-is-mounted";

type SheetSide = "left" | "right" | "bottom";

type SheetProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  side?: SheetSide;
  title?: string;
  className?: string;
};

const sideStyles: Record<SheetSide, string> = {
  left: "inset-y-0 left-0 w-80 max-w-[85vw] translate-x-0",
  right: "inset-y-0 right-0 w-80 max-w-[85vw] translate-x-0",
  bottom:
    "inset-x-0 bottom-0 rounded-t-2xl max-h-[85vh] translate-y-0",
};

export function Sheet({ open, onClose, children, side = "bottom", title, className }: SheetProps) {
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

  if (!mounted || !open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "fixed z-50 flex flex-col border-border bg-card shadow-2xl transition-transform",
          side === "bottom" && "border-t",
          (side === "left" || side === "right") && "border-r",
          sideStyles[side],
          className,
        )}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          {title && (
            <h2 className="text-base font-semibold text-card-foreground">
              {title}
            </h2>
          )}
          {!title && side === "bottom" && (
            <div className="mx-auto mt-1 h-1 w-10 rounded-full bg-border" />
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
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  );
}
