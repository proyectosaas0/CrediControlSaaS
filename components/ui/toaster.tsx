"use client";

import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      position="top-center"
      toastOptions={{
        className: "text-sm",
        duration: 4000,
      }}
    />
  );
}
