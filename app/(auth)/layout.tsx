import { Zap } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-full flex-col items-center justify-center overflow-hidden p-4 sm:p-8">
      {/* Atmosphere */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 45% at 50% 0%, color-mix(in srgb, var(--primary) 13%, transparent), transparent 70%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            "linear-gradient(color-mix(in srgb, var(--primary) 6%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb, var(--primary) 6%, transparent) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage:
            "radial-gradient(ellipse 80% 60% at 50% 35%, black, transparent 75%)",
        }}
      />

      <div className="dash-rise relative w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl">
        {/* Brand */}
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-violet-600 shadow-lg shadow-primary/30 md:h-12 md:w-12">
            <div className="absolute inset-0 rounded-2xl bg-white/10" />
            <Zap className="relative h-5 w-5 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <p className="font-display text-lg font-bold tracking-tight text-foreground md:text-xl">
              CrediControl
            </p>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
              Cobranza digital
            </p>
          </div>
        </div>

        <div className="relative rounded-2xl border border-primary/15 bg-white/[0.02] p-[1px] shadow-2xl shadow-primary/10 backdrop-blur-xl">
          <div className="rounded-2xl bg-black/40 p-6 sm:p-8 lg:p-10">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
