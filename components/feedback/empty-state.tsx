import { cn } from "@/components/ui/cn";
import type { ReactNode } from "react";

type EmptyStateProps = {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "dash-rise relative flex flex-col items-center justify-center gap-4 overflow-hidden rounded-2xl border border-dashed border-border py-14 text-center",
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 0%, color-mix(in srgb, var(--primary) 5%, transparent), transparent)",
        }}
      />
      {icon && (
        <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/[0.07] text-muted-foreground ring-1 ring-primary/15 [&_svg]:h-6 [&_svg]:w-6">
          {icon}
        </div>
      )}
      <div className="relative space-y-1.5">
        <h3 className="font-display text-base font-bold text-foreground">{title}</h3>
        {description && (
          <p className="max-w-sm text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      {action && <div className="relative">{action}</div>}
    </div>
  );
}
