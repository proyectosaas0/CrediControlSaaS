import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/components/ui/cn";

type ButtonVariant = "primary" | "secondary" | "danger" | "success" | "ghost" | "outline";
type ButtonSize = "sm" | "md" | "lg";

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-gradient-to-b from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/20 hover:from-indigo-400 hover:to-indigo-500 focus-visible:ring-primary",
  secondary:
    "bg-white/[0.06] text-foreground hover:bg-white/[0.1] focus-visible:ring-ring",
  danger:
    "bg-gradient-to-b from-rose-500 to-rose-600 text-white shadow-lg shadow-rose-500/20 hover:from-rose-400 hover:to-rose-500 focus-visible:ring-danger",
  success:
    "bg-gradient-to-b from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/20 hover:from-emerald-400 hover:to-emerald-500 focus-visible:ring-success",
  ghost:
    "text-foreground hover:bg-white/[0.06] focus-visible:ring-ring",
  outline:
    "border border-white/[0.08] bg-transparent text-foreground hover:bg-white/[0.04] focus-visible:ring-ring",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 min-h-11 px-4 text-sm",
  lg: "h-14 min-h-14 px-6 text-base",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", disabled, loading, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          variantStyles[variant],
          sizeStyles[size],
          className,
        )}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";

export { variantStyles, sizeStyles };
export type { ButtonVariant, ButtonSize };

export function buttonClasses(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
    variantStyles[variant],
    sizeStyles[size],
  );
}
