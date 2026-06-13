import { cn } from "@/components/ui/cn";

export function PlatformStat({
  icon: Icon,
  label,
  value,
  chip,
  delay,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  chip: string;
  delay: number;
}) {
  return (
    <div
      className="dash-rise flex items-center gap-4 rounded-2xl border border-border bg-card px-4 py-4 backdrop-blur-sm"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", chip)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </p>
        <p className="mt-1 truncate font-display text-xl font-bold leading-none tracking-tight text-foreground tabular-nums">
          {value}
        </p>
      </div>
    </div>
  );
}
