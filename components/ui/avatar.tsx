import { cn } from "@/components/ui/cn";
import Image from "next/image";
import type { HTMLAttributes } from "react";

type AvatarSize = "sm" | "md" | "lg";

const sizeStyles: Record<AvatarSize, string> = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
};

const sizePixels: Record<AvatarSize, number> = {
  sm: 32,
  md: 40,
  lg: 48,
};

type AvatarProps = HTMLAttributes<HTMLDivElement> & {
  initials?: string;
  size?: AvatarSize;
  src?: string;
  alt?: string;
};

export function Avatar({ className, initials, size = "md", src, alt, ...props }: AvatarProps) {
  if (src) {
    return (
      <div
        className={cn(
          "relative inline-flex shrink-0 overflow-hidden rounded-full",
          sizeStyles[size],
          className,
        )}
        {...props}
      >
        <Image
          src={src}
          alt={alt ?? ""}
          width={sizePixels[size]}
          height={sizePixels[size]}
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-medium",
        sizeStyles[size],
        className,
      )}
      {...props}
    >
      {initials ?? "?"}
    </div>
  );
}
