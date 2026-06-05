"use client";

import { CheckCircle2 } from "lucide-react";

type SuccessAnimationProps = {
  visible: boolean;
};

export function SuccessAnimation({ visible }: SuccessAnimationProps) {
  if (!visible) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[70] flex items-center justify-center bg-success/10">
      <div className="animate-bounce">
        <CheckCircle2 className="h-24 w-24 text-success drop-shadow-lg" />
      </div>
    </div>
  );
}
