export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-full flex-col items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-md">
        <div className="relative rounded-2xl border border-white/[0.08] bg-white/[0.02] p-[1px] shadow-2xl shadow-indigo-500/5 backdrop-blur-xl">
          <div className="rounded-2xl bg-black/40 p-6 sm:p-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
