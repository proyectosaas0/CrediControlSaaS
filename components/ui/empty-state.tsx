import type { LucideIcon } from "lucide-react";
import { cn } from "@/components/ui/cn";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
};

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "dash-rise relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-border py-14 text-center",
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
      <div className="relative mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/[0.07] ring-1 ring-primary/15">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="relative font-display text-base font-bold text-foreground">{title}</p>
      {description && (
        <p className="relative mt-1 max-w-xs text-xs text-muted-foreground">{description}</p>
      )}
      {action && <div className="relative mt-4">{action}</div>}
    </div>
  );
}
