import type { Metadata } from "next";
import "./globals.css";
import AppWalletProvider from "@/components/providers/AppWalletProvider";
import { PageTransition } from "@/components/ui/page-transition";
import { AppLayout } from "@/components/layout/app-layout";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "SME-Vault",
  description: "Secure, non-custodial treasury management for SMEs on Solana.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-background text-foreground">
        <AppWalletProvider>
              {children}
        </AppWalletProvider>
        <Toaster />
      </body>
    </html>
  );
}
