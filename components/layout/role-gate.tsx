"use client";

import type { ReactNode } from "react";
import type { AppRole } from "@/lib/auth";

type RoleGateProps = {
  children: ReactNode;
  allowed: AppRole[];
  role: AppRole | null;
  fallback?: ReactNode;
};

export function RoleGate({ children, allowed, role, fallback = null }: RoleGateProps) {
  if (!role || !allowed.includes(role)) return <>{fallback}</>;
  return <>{children}</>;
}
