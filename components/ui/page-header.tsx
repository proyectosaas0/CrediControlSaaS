"use client";

import Link from "next/link";
import { Search, ArrowRight } from "lucide-react";
import { cn } from "@/components/ui/cn";
import type { InputHTMLAttributes, ReactNode } from "react";

/* ─────────────────────────── PageHeader ───────────────────────────
 * Cabecera estándar de página: eyebrow opcional, título display,
 * subtítulo y acciones a la derecha. Entra con dash-rise.
 */

type PageHeaderProps = {
  title: ReactNode;
  subtitle?: ReactNode;
  eyebrow?: ReactNode;
  actions?: ReactNode;
  className?: string;
};

export function PageHeader({
  title,
  subtitle,
  eyebrow,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "dash-rise flex flex-wrap items-end justify-between gap-x-4 gap-y-3",
        className,
      )}
    >
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
            {eyebrow}
          </p>
        )}
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

/* ─────────────────────────── SectionHead ───────────────────────────
 * Título de sección con contador, hairline degradada y enlace.
 */

export function SectionHead({
  title,
  href,
  linkLabel,
  count,
  className,
}: {
  title: string;
  href?: string;
  linkLabel?: string;
  count?: number;
  className?: string;
}) {
  return (
    <div className={cn("mb-4 flex items-center justify-between gap-4", className)}>
      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        <h2 className="shrink-0 font-display text-lg font-bold tracking-tight text-foreground">
          {title}
        </h2>
        {count !== undefined && (
          <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 px-1.5 text-[11px] font-bold tabular-nums text-primary">
            {count}
          </span>
        )}
        <span className="hidden h-px flex-1 bg-gradient-to-r from-border to-transparent sm:block" />
      </div>
      {href && linkLabel && (
        <Link
          href={href}
          className="group flex shrink-0 items-center gap-1 text-xs font-semibold text-muted-foreground transition-colors hover:text-primary"
        >
          {linkLabel}
          <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}

/* ─────────────────────────── FilterPills ─────────────────────────── */

export type PillOption<T extends string> = {
  value: T;
  label: string;
  count?: number;
};

export function FilterPills<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: PillOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex gap-1.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className,
      )}
      role="tablist"
    >
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              "flex min-h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition-all",
              active
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                : "border border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground",
            )}
          >
            {opt.label}
            {opt.count !== undefined && (
              <span
                className={cn(
                  "rounded-full px-1.5 text-[10px] font-bold tabular-nums leading-[1.5]",
                  active
                    ? "bg-white/20 text-primary-foreground"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {opt.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ─────────────────────────── SearchInput ─────────────────────────── */

type SearchInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  containerClassName?: string;
};

export function SearchInput({
  className,
  containerClassName,
  ...props
}: SearchInputProps) {
  return (
    <div className={cn("group relative", containerClassName)}>
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
      <input
        type="search"
        className={cn(
          "h-11 w-full rounded-xl border border-border bg-card pl-10 pr-3 text-sm text-foreground backdrop-blur-sm transition-colors",
          "placeholder:text-muted-foreground/70",
          "focus-visible:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
          "[&::-webkit-search-cancel-button]:appearance-none",
          className,
        )}
        {...props}
      />
    </div>
  );
}

/* ─────────────────────────── ListStagger helper ───────────────────────────
 * Delay escalonado para entradas de listas; se satura a 360ms para que
 * las listas largas no tarden en aparecer.
 */

export function staggerDelay(index: number, step = 45, max = 360) {
  return { animationDelay: `${Math.min(index * step, max)}ms` };
}
