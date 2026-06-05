"use client";

import { type ReactNode } from "react";
import type { AppRole } from "@/lib/auth";

type AuthContextValue = {
  user: { id: string; email?: string } | null;
  role: AppRole | null;
  orgId: string | null;
};

import { createContext, useContext } from "react";

const AuthContext = createContext<AuthContextValue>({
  user: null,
  role: null,
  orgId: null,
});

export function AuthProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: AuthContextValue;
}) {
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
