import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import { QueryProvider } from "@/providers/query-provider";
import { OnlineProvider } from "@/providers/online-provider";
import { AuthProvider } from "@/providers/auth-provider";
import { logger } from "@/lib/logger";
import { initSentry } from "@/lib/monitoring/sentry";
import "./globals.css";

// Initialize Sentry on server startup
if (typeof window === "undefined") {
  initSentry();
}

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CrediControl — Cobranza diaria digital",
  description:
    "Sistema SaaS de cobranzas diarias para prestamistas. Digitaliza tu cobro, controla tu cartera, envia comprobantes por WhatsApp.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  if (typeof window === "undefined") {
    logger.info("RootLayout initialized");
  }

  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <QueryProvider>
          <AuthProvider>
            <OnlineProvider>
              {children}
              <Toaster />
            </OnlineProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
