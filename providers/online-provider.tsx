"use client";

import { type ReactNode } from "react";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { OfflineBanner } from "@/components/feedback/offline-banner";

export function OnlineProvider({ children }: { children: ReactNode }) {
  const isOnline = useOnlineStatus();

  return (
    <>
      {!isOnline && <OfflineBanner />}
      <div className={!isOnline ? "pt-10" : ""}>{children}</div>
    </>
  );
}
