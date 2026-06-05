import { cn } from "@/components/ui/cn";
import type { HTMLAttributes } from "react";

type SpinnerSize = "sm" | "md" | "lg";

const sizeStyles: Record<SpinnerSize, string> = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-10 w-10 border-3",
};

type SpinnerProps = HTMLAttributes<HTMLDivElement> & {
  size?: SpinnerSize;
};

export function Spinner({ className, size = "md", ...props }: SpinnerProps) {
  return (
    <div
      role="status"
      aria-label="Cargando"
      className={cn(
        "inline-block animate-spin rounded-full border-muted border-t-primary",
        sizeStyles[size],
        className,
      )}
      {...props}
    >
      <span className="sr-only">Cargando...</span>
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="flex flex-1 items-center justify-center py-20">
      <Spinner size="lg" />
    </div>
  );
}
