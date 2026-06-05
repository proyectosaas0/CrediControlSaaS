"use client";

import { createContext, useContext, useCallback, useState, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import type { AppRole } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/feedback/spinner";
import { useSyncExternalStore } from "react";

type AuthState = {
  user: { id: string; email?: string } | null;
  role: AppRole | null;
  orgId: string | null;
  loading: boolean;
};

type AuthContextValue = AuthState & {
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  role: null,
  orgId: null,
  loading: true,
  signOut: async () => {},
});

let authState: AuthState = {
  user: null,
  role: null,
  orgId: null,
  loading: true,
};

type Listener = () => void;
const listeners: Set<Listener> = new Set();

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return authState;
}

function getServerSnapshot() {
  return { user: null, role: null, orgId: null, loading: true };
}

let initialized = false;

function initAuth() {
  if (initialized) return;
  initialized = true;

  const supabase = createClient();

  supabase.auth.getSession().then(({ data: { session } }) => {
    if (session?.user) {
      authState = {
        user: { id: session.user.id, email: session.user.email },
        role: (session.user.app_metadata?.rol as AppRole | undefined) ?? null,
        orgId: (session.user.app_metadata?.organization_id as string | undefined) ?? null,
        loading: false,
      };
    } else {
      authState = { user: null, role: null, orgId: null, loading: false };
    }
    emitChange();
  });

  supabase.auth.onAuthStateChange((_event, session) => {
    if (session?.user) {
      authState = {
        user: { id: session.user.id, email: session.user.email },
        role: (session.user.app_metadata?.rol as AppRole | undefined) ?? null,
        orgId: (session.user.app_metadata?.organization_id as string | undefined) ?? null,
        loading: false,
      };
    } else {
      authState = { user: null, role: null, orgId: null, loading: false };
    }
    emitChange();
  });
}

if (typeof window !== "undefined") {
  initAuth();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [, forceUpdate] = useState(0);

  const signOut = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    authState = { user: null, role: null, orgId: null, loading: false };
    emitChange();
    forceUpdate((n) => n + 1);
    router.push("/login");
    router.refresh();
  }, [router]);

  if (state.loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ ...state, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
