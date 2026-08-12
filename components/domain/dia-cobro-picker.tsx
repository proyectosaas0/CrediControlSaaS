"use client";

import { useState } from "react";
import { cn } from "@/components/ui/cn";
import { DIAS_COBRO, DIA_COBRO_LABELS } from "@/lib/schemas/admin";

type DiaCobroPickerProps = {
  value: string[];
  onChange: (value: string[]) => void;
};

const MES_DIAS = Array.from({ length: 31 }, (_, i) => String(i + 1));
const WEEKDAY_SET = new Set<string>(DIAS_COBRO);

export function DiaCobroPicker({ value, onChange }: DiaCobroPickerProps) {
  const hasMonthday = value.some((v) => !WEEKDAY_SET.has(v));
  const [mode, setMode] = useState<"semanal" | "mensual">(hasMonthday ? "mensual" : "semanal");

  function toggle(v: string) {
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  }

  function switchMode(next: "semanal" | "mensual") {
    setMode(next);
    onChange([]);
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-foreground">Día de cobro</label>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => switchMode("semanal")}
          className={cn(
            "flex-1 rounded-lg border-2 px-3 py-1.5 text-sm font-medium transition-colors",
            mode === "semanal"
              ? "border-primary bg-primary/10 text-primary"
              : "border-border text-muted-foreground hover:border-muted-foreground/30",
          )}
        >
          Semanal
        </button>
        <button
          type="button"
          onClick={() => switchMode("mensual")}
          className={cn(
            "flex-1 rounded-lg border-2 px-3 py-1.5 text-sm font-medium transition-colors",
            mode === "mensual"
              ? "border-primary bg-primary/10 text-primary"
              : "border-border text-muted-foreground hover:border-muted-foreground/30",
          )}
        >
          Mensual (día del mes)
        </button>
      </div>

      {mode === "semanal" ? (
        <div className="flex flex-wrap gap-1.5">
          {DIAS_COBRO.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => toggle(d)}
              className={cn(
                "rounded-full border-2 px-3 py-1.5 text-xs font-medium transition-colors",
                value.includes(d)
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-muted-foreground/30",
              )}
            >
              {DIA_COBRO_LABELS[d]}
            </button>
          ))}
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-1.5">
            {[
              { label: "15 y 30", days: ["15", "30"] },
              { label: "1 y 15", days: ["1", "15"] },
              { label: "Fin de mes", days: ["30"] },
            ].map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => onChange(preset.days)}
                className="rounded-full border border-border px-3 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
              >
                {preset.label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {MES_DIAS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => toggle(d)}
                className={cn(
                  "flex h-8 items-center justify-center rounded-lg border-2 text-xs font-medium tabular-nums transition-colors",
                  value.includes(d)
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-muted-foreground/30",
                )}
              >
                {d}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
